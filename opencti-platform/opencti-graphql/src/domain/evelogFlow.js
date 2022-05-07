import * as R from 'ramda';
import { dissoc, filter } from 'ramda';
import {
  distributionEntities,
  loadById,
} from '../database/middleware';
import { listEvelogs } from '../database/repository';
import { elCount } from '../database/engine';
import { READ_INDEX_EVELOGS } from '../database/utils';
import { isEvelogFlow } from '../schema/evelogFlow';
import { ABSTRACT_EVELOG_FLOW } from '../schema/general';
import { EVELOG_EVENT_TYPE_FLOW } from '../schema/evelogFlow';

export const findById = (user, evelogFlowId) => {
  //console.log("user:");
  return loadById(user, evelogFlowId, ABSTRACT_EVELOG_FLOW);
};

export const findAll = async (user, args) => {
  let eventTypes = [];
  if (args.eventTypes && args.eventTypes.length > 0) {
    eventTypes = filter((type) => isEvelogFlow(type), args.eventTypes);
  }
  if (eventTypes.length === 0) {
    eventTypes.push(EVELOG_EVENT_TYPE_FLOW);
  }
  console.log("findall args:\n");
  console.log(args);
  console.log("findall eventTypes:\n");
  console.log(eventTypes);
  console.log("findall eventTypes end\n");
  return listEvelogs(user, eventTypes, args);
};

// region by elastic
export const evelogFlowsNumber = (user, args) => ({
  count: elCount(user, READ_INDEX_EVELOGS, args),
  total: elCount(user, READ_INDEX_EVELOGS, dissoc('endDate', args)),
});


// region mutation
export const evelogFlowDistribution = async (user, args) => distributionEntities(user, ABSTRACT_STIX_CYBER_OBSERVABLE, [], args);

export const evelogFlowDistributionByEntity = async (user, args) => {
  const { objectId } = args;
  const filters = [{ isRelation: true, type: args.relationship_type, value: objectId }];
  return distributionEntities(user, ABSTRACT_EVELOG_FLOW, filters, args);
};
