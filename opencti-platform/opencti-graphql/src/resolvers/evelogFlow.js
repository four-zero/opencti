import {
  findById,
  findAll,
  evelogFlowsNumber,
  evelogFlowDistributionByEntity,
  evelogFlowDistribution,
} from '../domain/evelogFlow';
import { evelogFlowOptions } from '../schema/evelogFlow';

const evelogFlowResolvers = {
  Query: {
    evelogFlow: (_, { id }, { user }) => findById(user, id),
    evelogFlows: (_, args, { user }) => findAll(user, args),
    evelogFlowsNumber: (_, args, { user }) => evelogFlowsNumber(user, args),
    evelogFlowsDistribution: (_, args, { user }) => {
      if (args.objectId && args.objectId.length > 0) {
        return evelogFlowDistributionByEntity(user, args);
      }
      return evelogFlowDistribution(user, args);
    },
  },
  EvelogFlowsFilter: evelogFlowOptions.EvelogFlowsFilter,
  EvelogFlow: {
    __resolveType(obj) {
      console.log("graphql EvelogFlow", obj);
      return 'EvelogFlowOne';
      //if (obj.entity_type) {
      //  return obj.entity_type.replace(/(?:^|-)(\w)/g, (matches, letter) => letter.toUpperCase());
      //}
      //if (includes(ABSTRACT_STIX_META_RELATIONSHIP, obj.parent_types)) {
      //  return 'StixMetaRelationship';
      //}
      //return 'Unknown';
    },
  },
};

export default evelogFlowResolvers;
