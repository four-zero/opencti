import * as R from 'ramda';
import {
  ABSTRACT_EVELOG,
  schemaTypes,
} from './general';

export const EVELOG_FLOW = 'flow';
export const EVELOG_FLOW_TCP = 'udp';
export const EVELOG_FLOW_UDP = 'udp';
export const EVELOG_FLOW_ICMP = 'icmp';

const EVELOG_LAYER4 = [
  EVELOG_FLOW_TCP,
  EVELOG_FLOW_UDP,
  EVELOG_FLOW_ICMP,
];

export const EVELOG_HTTP = 'http';
export const EVELOG_ALERT = 'alert';
export const EVELOG_FILEINFO = 'fileinfo';
export const EVELOG_STATS = 'stats';

const EVELOG_LAYER7 = [
  EVELOG_HTTP,
];
const EVELOG_EVENT = [
  EVELOG_ALERT,
];
const EVELOG_FILE = [
  EVELOG_FILEINFO,
];
const EVELOG = [
  ...EVELOG_LAYER4,
  ...EVELOG_LAYER7,
  ...EVELOG_EVENT,
  ...EVELOG_FILE,
];

schemaTypes.register(ABSTRACT_EVELOG, EVELOG);

export const isEvelogFlow = (type) => R.includes(type, EVELOG_LAYER4) || type === ABSTRACT_EVELOG;

export const evelogFlowOptions = {
  EvelogFlowsFilter: {
    flow_id: 'flow_id',
    event_type: 'event_type',
    proto: 'proto',
  },
};

//R.forEachObjIndexed((value, key) => schemaTypes.registerAttributes(key, value), stixCyberObservablesAttributes);
