/* eslint-disable camelcase */
import * as R from 'ramda';
import { buildDeleteEvent, buildScanEvent, createStreamProcessor, lockResource } from '../database/redis';
import conf, { ENABLED_RULE_ENGINE, logApp } from '../config/conf';
import { createEntity, internalLoadById, listAllRelations, patchAttribute, stixLoadById } from '../database/middleware';
import { INDEX_INTERNAL_OBJECTS, isEmptyField, isNotEmptyField, READ_DATA_INDICES } from '../database/utils';
import { EVENT_TYPE_CREATE, EVENT_TYPE_DELETE, EVENT_TYPE_MERGE, EVENT_TYPE_UPDATE } from '../database/rabbitmq';
import { elList, elUpdate } from '../database/elasticSearch';
import { STIX_RELATIONSHIPS } from '../schema/stixRelationship';
import { RULE_PREFIX } from '../schema/general';
import { ENTITY_TYPE_RULE, ENTITY_TYPE_RULE_MANAGER } from '../schema/internalObject';
import { TYPE_LOCK_ERROR, UnsupportedError } from '../config/errors';
import { createRuleTask, deleteTask, findAll } from '../domain/task';
import { getActivatedRules, getRule } from '../domain/rule';
import { RULE_MANAGER_USER } from '../rules/RuleUtils';
import { extractFieldsOfPatch, MIN_LIVE_STREAM_EVENT_VERSION } from '../graphql/sseMiddleware';
import { buildStixData } from '../database/stix';
import { generateInternalType, getParentTypes, getTypeFromStixId } from '../schema/schemaUtils';
import declaredRules from '../rules/RuleDeclarations';

const RULE_ENGINE_ID = 'rule_engine_settings';
const RULE_ENGINE_KEY = conf.get('rule_engine:lock_key');

export const getManagerInfo = async (user) => {
  const ruleStatus = await internalLoadById(user, RULE_ENGINE_ID);
  return { activated: ENABLED_RULE_ENGINE, ...ruleStatus };
};

export const setRuleActivation = async (user, ruleId, active) => {
  const resolvedRule = await getRule(ruleId);
  if (isEmptyField(resolvedRule)) {
    throw UnsupportedError(`Cant ${active ? 'enable' : 'disable'} undefined rule ${ruleId}`);
  }
  await createEntity(user, { internal_id: ruleId, active, update: true }, ENTITY_TYPE_RULE);
  if (ENABLED_RULE_ENGINE) {
    const tasksFilters = [
      { key: 'type', values: ['RULE'] },
      { key: 'rule', values: [ruleId] },
    ];
    const tasks = await findAll(user, { filters: tasksFilters, connectionFormat: false });
    await Promise.all(tasks.map((t) => deleteTask(user, t.id)));
    await createRuleTask(user, { rule: ruleId, enable: active });
  }
  return getRule(ruleId);
};

const ruleMergeHandler = async (event) => {
  const { data } = event;
  // Need to generate events for deletion
  const events = data.sources.map((s) => buildDeleteEvent(RULE_MANAGER_USER, s, stixLoadById));
  // Need to generate event for redo rule on updated element
  const mergeCallback = async (relationships) => {
    const creationEvents = relationships.map((r) => buildScanEvent(RULE_MANAGER_USER, r, stixLoadById));
    events.push(...creationEvents);
  };
  const listToArgs = { elementId: data.x_opencti_id, callback: mergeCallback };
  await listAllRelations(RULE_MANAGER_USER, STIX_RELATIONSHIPS, listToArgs);
  return events;
};

const isMatchRuleFilters = (rule, element) => {
  // Handle types filtering
  const { types = [], fromTypes = [], toTypes = [] } = rule.scopeFilters ?? {};
  if (types.length > 0) {
    const instanceType = element.relationship_type || generateInternalType(element);
    const elementTypes = [instanceType, ...getParentTypes(instanceType)];
    const isCompatibleType = types.some((r) => elementTypes.includes(r));
    if (!isCompatibleType) return false;
  }
  if (fromTypes.length > 0) {
    const { source_ref: fromId } = element;
    const fromType = getTypeFromStixId(fromId);
    const instanceFromTypes = [fromType, ...getParentTypes(fromType)];
    const isCompatibleType = fromTypes.some((r) => instanceFromTypes.includes(r));
    if (!isCompatibleType) return false;
  }
  if (toTypes.length > 0) {
    const { target_ref: toId } = element;
    const toType = getTypeFromStixId(toId);
    const instanceToTypes = [toType, ...getParentTypes(toType)];
    const isCompatibleType = toTypes.some((r) => instanceToTypes.includes(r));
    if (!isCompatibleType) return false;
  }
  return true;
};

const handleRuleError = async (event, error) => {
  const { eventId, type } = event;
  logApp.error(`Error applying ${type} event rule`, { event, error });
  const initIfNotExist = `if (ctx._source.errors == null) ctx._source.errors = [];`;
  const addError = `ctx._source.errors.add(["eventId": "${eventId}", "message": "${error.message}"]); `;
  const source = `${initIfNotExist} ${addError}`;
  await elUpdate(INDEX_INTERNAL_OBJECTS, RULE_ENGINE_ID, {
    script: { source, lang: 'painless' },
  });
};

export const rulesApplyDerivedEvents = async (eventId, derivedEvents, forRules = []) => {
  const events = derivedEvents.map((d) => ({ eventId, ...d }));
  // eslint-disable-next-line no-use-before-define
  await rulesApplyHandler(events, forRules);
};

export const rulesApplyHandler = async (events, forRules = []) => {
  if (isEmptyField(events) || events.length === 0) return;
  // Execute all rules if not specified
  const allActivatedRules = await getActivatedRules();
  const rules = forRules.length > 0 ? forRules : allActivatedRules;
  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];
    const { eventId, type, data, markings } = event;
    try {
      const element = { ...data, object_marking_refs: markings };
      // In case of merge convert the events to basic events and restart the process
      if (type === EVENT_TYPE_MERGE) {
        const derivedEvents = await ruleMergeHandler(event);
        await rulesApplyDerivedEvents(eventId, derivedEvents);
      }
      // In case of deletion, call clean on every impacted elements
      if (type === EVENT_TYPE_DELETE) {
        const filters = [{ key: `${RULE_PREFIX}*.dependencies`, values: [data.x_opencti_id], operator: 'wildcard' }];
        // eslint-disable-next-line no-use-before-define,prettier/prettier
        const opts = { filters, callback: (elements) => rulesCleanHandler(eventId, elements, declaredRules, data.x_opencti_id) };
        await elList(RULE_MANAGER_USER, READ_DATA_INDICES, opts);
      }
      // In case of update apply the event on every rules
      if (type === EVENT_TYPE_UPDATE) {
        for (let ruleIndex = 0; ruleIndex < rules.length; ruleIndex += 1) {
          const rule = rules[ruleIndex];
          // const instance = rebuildInstanceWithPatch(element, element.x_opencti_patch);
          const patchedFields = extractFieldsOfPatch(element.x_opencti_patch);
          const isImpactedFields = rule.scopePatch.some((f) => patchedFields.includes(f));
          const isImpactedElement = isMatchRuleFilters(rule, element);
          if (isImpactedElement && isImpactedFields) {
            const instance = await internalLoadById(RULE_MANAGER_USER, element.id);
            const stixData = buildStixData(instance);
            const derivedEvents = await rule.update(stixData, patchedFields);
            await rulesApplyDerivedEvents(eventId, derivedEvents);
          }
        }
      }
      // In case of creation apply the event on every rules
      if (type === EVENT_TYPE_CREATE) {
        for (let ruleIndex = 0; ruleIndex < rules.length; ruleIndex += 1) {
          const rule = rules[ruleIndex];
          const isImpactedElement = isMatchRuleFilters(rule, element);
          if (isImpactedElement) {
            const derivedEvents = await rule.insert(element);
            await rulesApplyDerivedEvents(eventId, derivedEvents);
          }
        }
      }
    } catch (e) {
      await handleRuleError(event, e);
    }
  }
};

export const rulesCleanHandler = async (eventId, instances, rules, dependencyId) => {
  for (let i = 0; i < instances.length; i += 1) {
    const instance = instances[i];
    for (let ruleIndex = 0; ruleIndex < rules.length; ruleIndex += 1) {
      const rule = rules[ruleIndex];
      const isElementCleanable = isNotEmptyField(instance[RULE_PREFIX + rule.id]);
      if (isElementCleanable) {
        const processingElement = await internalLoadById(RULE_MANAGER_USER, instance.internal_id);
        const derivedEvents = await rule.clean(processingElement, dependencyId);
        await rulesApplyDerivedEvents(eventId, derivedEvents);
      }
    }
  }
};

const ruleStreamHandler = async (streamEvents) => {
  // Create list of events to process
  const compatibleEvents = streamEvents.filter((event) => {
    const { data } = event;
    return data && parseInt(data.version, 10) >= MIN_LIVE_STREAM_EVENT_VERSION;
  });
  if (compatibleEvents.length > 0) {
    const ruleEvents = compatibleEvents.map((e) => {
      const { id, topic, data: eventData } = e;
      const { data, markings } = eventData;
      return { eventId: `stream--${id}`, type: topic, markings, data };
    });
    // Execute the events
    await rulesApplyHandler(ruleEvents);
    // Save the last processed event
    const lastEvent = R.last(compatibleEvents);
    const patch = { lastEventId: lastEvent.id };
    await patchAttribute(RULE_MANAGER_USER, RULE_ENGINE_ID, ENTITY_TYPE_RULE_MANAGER, patch);
  }
};

const initRuleManager = () => {
  let streamProcessor;
  return {
    start: async () => {
      let lock;
      try {
        // Lock the manager
        lock = await lockResource([RULE_ENGINE_KEY]);
        // Get the processor status
        const ruleSettingsInput = { internal_id: RULE_ENGINE_ID, errors: [] };
        const ruleStatus = await createEntity(RULE_MANAGER_USER, ruleSettingsInput, ENTITY_TYPE_RULE_MANAGER);
        // Start the stream listening
        streamProcessor = createStreamProcessor(RULE_MANAGER_USER, 'Rule manager', ruleStreamHandler);
        await streamProcessor.start(ruleStatus.lastEventId);
        // Handle hot module replacement resource dispose
        if (module.hot) {
          module.hot.dispose(async () => {
            await streamProcessor.shutdown();
          });
        }
        return true;
      } catch (e) {
        if (e.name === TYPE_LOCK_ERROR) {
          logApp.debug('[OPENCTI] Rule engine already started by another API');
        } else {
          logApp.error('[OPENCTI] Rule engine failed to start', { error: e });
        }
        return false;
      } finally {
        if (lock) await lock.unlock();
      }
    },
    shutdown: async () => {
      if (streamProcessor) {
        await streamProcessor.shutdown();
      }
      return true;
    },
  };
};
const ruleEngine = initRuleManager();

export const cleanRuleManager = async (user, eventId) => {
  // Clear the elastic status
  const patch = { lastEventId: eventId, errors: [] };
  const { element } = await patchAttribute(user, RULE_ENGINE_ID, ENTITY_TYPE_RULE_MANAGER, patch);
  // Restart the manager
  await ruleEngine.shutdown();
  await ruleEngine.start();
  // Return the updated element
  return { activated: ENABLED_RULE_ENGINE, ...element };
};

export default ruleEngine;
