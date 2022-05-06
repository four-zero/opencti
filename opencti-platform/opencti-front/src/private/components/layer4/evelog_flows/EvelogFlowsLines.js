import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { graphql, createPaginationContainer } from 'react-relay';
import { pathOr } from 'ramda';
import ListLinesContent from '../../../../components/list_lines/ListLinesContent';
import {
  EvelogFlowLine,
  EvelogFlowLineDummy,
} from './EvelogFlowLine';
import { setNumberOfElements } from '../../../../utils/Number';

const nbOfRowsToLoad = 50;

class EvelogFlowsLines extends Component {
  componentDidUpdate(prevProps) {
    setNumberOfElements(
      prevProps,
      this.props,
      'evelogFlows',
      this.props.setNumberOfElements.bind(this),
    );
  }

  render() {
    const {
      initialLoading,
      dataColumns,
      relay,
      onLabelClick,
      onToggleEntity,
      selectedElements,
      selectAll,
    } = this.props;
    console.log("debug EvelogFlowsLines on:");
    console.log(dataColumns);
    return (
      <ListLinesContent
        initialLoading={initialLoading}
        loadMore={relay.loadMore.bind(this)}
        hasMore={relay.hasMore.bind(this)}
        isLoading={relay.isLoading.bind(this)}
        dataList={pathOr(
          [],
          ['evelogFlows', 'edges'],
          this.props.data,
        )}
        globalCount={pathOr(
          nbOfRowsToLoad,
          ['evelogFlows', 'pageInfo', 'globalCount'],
          this.props.data,
        )}
        LineComponent={<EvelogFlowLine />}
        DummyLineComponent={<EvelogFlowLineDummy />}
        dataColumns={dataColumns}
        nbOfRowsToLoad={nbOfRowsToLoad}
        onLabelClick={onLabelClick.bind(this)}
        selectedElements={selectedElements}
        selectAll={selectAll}
        onToggleEntity={onToggleEntity.bind(this)}
      />
    );
  }
}

EvelogFlowsLines.propTypes = {
  classes: PropTypes.object,
  paginationOptions: PropTypes.object,
  dataColumns: PropTypes.object.isRequired,
  data: PropTypes.object,
  relay: PropTypes.object,
  evelogFlows: PropTypes.object,
  initialLoading: PropTypes.bool,
  onLabelClick: PropTypes.func,
  setNumberOfElements: PropTypes.func,
  onToggleEntity: PropTypes.func,
  selectedElements: PropTypes.object,
  selectAll: PropTypes.bool,
};

export const evelogFlowsLinesSubTypesQuery = graphql`
  query EvelogFlowsLinesSubTypesQuery($type: String!) {
    subTypes(type: $type) {
      edges {
        node {
          label
        }
      }
    }
  }
`;

export const evelogFlowsLinesAttributesQuery = graphql`
  query EvelogFlowsLinesAttributesQuery($elementType: String!) {
    schemaAttributes(elementType: $elementType) {
      edges {
        node {
          value
        }
      }
    }
  }
`;

export const evelogFlowsLinesQuery = graphql`
  query EvelogFlowsLinesPaginationQuery(
    $types: [String]
    $search: String
    $count: Int!
    $cursor: ID
    $orderBy: EvelogFlowsOrdering
    $orderMode: OrderingMode
    $filters: [EvelogFlowsFiltering]
  ) {
    ...EvelogFlowsLines_data
      @arguments(
        types: $types
        search: $search
        count: $count
        cursor: $cursor
        orderBy: $orderBy
        orderMode: $orderMode
        filters: $filters
      )
  }
`;

export const evelogFlowsLinesSearchQuery = graphql`
  query EvelogFlowsLinesSearchQuery($search: String) {
    evelogFlows(search: $search) {
      edges {
        node {
          timestamp
        }
      }
    }
  }
`;

export default createPaginationContainer(
  EvelogFlowsLines,
  {
    data: graphql`
      fragment EvelogFlowsLines_data on Query
      @argumentDefinitions(
        types: { type: "[String]" }
        search: { type: "String" }
        count: { type: "Int", defaultValue: 25 }
        cursor: { type: "ID" }
        orderBy: {
          type: "EvelogFlowsOrdering"
          defaultValue: timestamp
        }
        orderMode: { type: "OrderingMode", defaultValue: desc }
        filters: { type: "[EvelogFlowsFiltering]" }
      ) {
        evelogFlows(
          types: $types
          search: $search
          first: $count
          after: $cursor
          orderBy: $orderBy
          orderMode: $orderMode
          filters: $filters
        ) @connection(key: "Pagination_evelogFlows") {
          edges {
            node {
              timestamp
              proto
              src_ip
              src_port
              dest_ip
              dest_port
              ...EvelogFlowLine_node
            }
          }
          pageInfo {
            endCursor
            hasNextPage
            globalCount
          }
        }
      }
    `,
  },
  {
    direction: 'forward',
    getConnectionFromProps(props) {
      return props.data && props.data.evelogFlows;
    },
    getFragmentVariables(prevVars, totalCount) {
      return {
        ...prevVars,
        count: totalCount,
      };
    },
    getVariables(props, { count, cursor }, fragmentVariables) {
      return {
        types: fragmentVariables.types,
        search: fragmentVariables.search,
        count,
        cursor,
        orderBy: fragmentVariables.orderBy,
        orderMode: fragmentVariables.orderMode,
        filters: fragmentVariables.filters,
      };
    },
    query: evelogFlowsLinesQuery,
  },
);
