import * as R from 'ramda';
import {
  ABSTRACT_EVELOG_FLOW,
  schemaTypes,
} from './general';

export const EVELOG_EVENT_TYPE_FLOW = 'flow';

export const EVELOG_FLOW_PROTO_IPV4 = 'IPv4';
export const EVELOG_FLOW_PROTO_IPV6 = 'IPv6';
export const EVELOG_FLOW_PROTO_ICMP = 'ICMP';
export const EVELOG_FLOW_PROTO_TCP = 'TCP';
export const EVELOG_FLOW_PROTO_UDP = 'UDP';

const EVELOG_FLOW_PROTO = [
  EVELOG_FLOW_PROTO_IPV4,
  EVELOG_FLOW_PROTO_IPV6,
  EVELOG_FLOW_PROTO_ICMP,
  EVELOG_FLOW_PROTO_TCP,
  EVELOG_FLOW_PROTO_UDP,
];

const EVELOG_FLOW_EVENT_TYPE = [
  EVELOG_EVENT_TYPE_FLOW,
];

schemaTypes.register(ABSTRACT_EVELOG_FLOW, EVELOG_FLOW_PROTO);

export const isEvelogFlow = (type) => R.includes(type, EVELOG_FLOW_EVENT_TYPE);

export const evelogFlowOptions = {
  EvelogFlowsFilter: {
    timestamp: 'timestamp',
    flow_id: 'flow_id',
    in_iface: 'in_iface',
    event_type: 'event_type',
    proto: 'proto',
    app_proto: 'app_proto',
    src_ip: 'src_ip',
    src_port: 'src_port',
    dest_ip: 'dest_ip',
    dest_port: 'dest_port',
  },
};

//R.forEachObjIndexed((value, key) => schemaTypes.registerAttributes(key, value), stixCyberObservablesAttributes);
