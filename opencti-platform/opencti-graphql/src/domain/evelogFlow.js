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
import { ABSTRACT_EVELOG } from '../schema/general';

export const findById = (user, evelogFlowId) => {
  //console.log("user:");
  return loadById(user, evelogFlowId, ABSTRACT_EVELOG);
};

export const findAll = async (user, args) => {
  let types = [];
  if (args.types && args.types.length > 0) {
    types = filter((type) => isEvelogFlow(type), args.types);
  }
  if (types.length === 0) {
    types.push(ABSTRACT_EVELOG);
  }
  console.log("findall args:\n");
  console.log(args);
  console.log("findall types:\n");
  console.log(types);
  return listEvelogs(user, types, args);
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
  return distributionEntities(user, ABSTRACT_EVELOG, filters, args);
};
