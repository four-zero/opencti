import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import withStyles from '@mui/styles/withStyles';
import * as R from 'ramda';
import { QueryRenderer } from '../../../relay/environment';
import ListLines from '../../../components/list_lines/ListLines';
import EvelogFlowsLines, {
  evelogFlowsLinesQuery,
} from './evelog_flows/EvelogFlowsLines';
import inject18n from '../../../components/i18n';
import EvelogFlowsRightBar from './evelog_flows/EvelogFlowsRightBar';
import {
  buildViewParamsFromUrlAndStorage,
  convertFilters,
  saveViewParameters,
} from '../../../utils/ListParameters';
import Security, {
  UserContext,
  KNOWLEDGE_KNUPDATE,
} from '../../../utils/Security';
import ToolBar from '../data/ToolBar';
import { isUniqFilter } from '../common/lists/Filters';

const styles = () => ({
  container: {
    paddingRight: 250,
  },
});

class EvelogFlows extends Component {
  constructor(props) {
    super(props);
    const params = buildViewParamsFromUrlAndStorage(
      props.history,
      props.location,
      'view-evelog_flows',
    );
    this.state = {
      sortBy: R.propOr('timestamp', 'sortBy', params),
      orderAsc: R.propOr(false, 'orderAsc', params),
      searchTerm: R.propOr('', 'searchTerm', params),
      view: R.propOr('lines', 'view', params),
      filters: R.propOr({}, 'filters', params),
      eventTypes: R.propOr([], 'eventTypes', params),
      openExports: false,
      numberOfElements: { number: 0, symbol: '' },
      selectedElements: null,
      selectAll: false,
    };
  }

  saveView() {
    saveViewParameters(
      this.props.history,
      this.props.location,
      'view-evelog_flows',
      this.state,
    );
  }

  handleSearch(value) {
    this.setState({ searchTerm: value }, () => this.saveView());
  }

  handleSort(field, orderAsc) {
    this.setState({ sortBy: field, orderAsc }, () => this.saveView());
  }

  handleToggleExports() {
    this.setState({ openExports: !this.state.openExports });
  }

  handleToggle(type) {
    if (this.state.eventTypes.includes(type)) {
      this.setState(
        {
          eventTypes: R.filter(
            (t) => t !== type,
            this.state.eventTypes,
          ),
        },
        () => this.saveView(),
      );
    } else {
      this.setState(
        { eventTypes: R.append(type, this.state.eventTypes) },
        () => this.saveView(),
      );
    }
  }

  handleClear() {
    this.setState({ eventTypes: [] }, () => this.saveView());
  }

  handleToggleSelectEntity(entity, event) {
    event.stopPropagation();
    event.preventDefault();
    const { selectedElements } = this.state;
    if (entity.id in (selectedElements || {})) {
      const newSelectedElements = R.omit([entity.id], selectedElements);
      this.setState({
        selectAll: false,
        selectedElements: newSelectedElements,
      });
    } else {
      const newSelectedElements = R.assoc(
        entity.id,
        entity,
        selectedElements || {},
      );
      this.setState({
        selectAll: false,
        selectedElements: newSelectedElements,
      });
    }
  }

  handleToggleSelectAll() {
    this.setState({ selectAll: !this.state.selectAll, selectedElements: null });
  }

  handleClearSelectedElements() {
    this.setState({ selectAll: false, selectedElements: null });
  }

  handleAddFilter(key, flow_id, value, event = null) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    if (this.state.filters[key] && this.state.filters[key].length > 0) {
      this.setState(
        {
          filters: R.assoc(
            key,
            isUniqFilter(key)
              ? [{ flow_id, value }]
              : R.uniqBy(R.prop('flow_id'), [
                { id, value },
                ...this.state.filters[key],
              ]),
            this.state.filters,
          ),
        },
        () => this.saveView(),
      );
    } else {
      this.setState(
        {
          filters: R.assoc(key, [{ flow_id, value }], this.state.filters),
        },
        () => this.saveView(),
      );
    }
  }

  handleRemoveFilter(key) {
    this.setState({ filters: R.dissoc(key, this.state.filters) }, () => this.saveView());
  }

  setNumberOfElements(numberOfElements) {
    this.setState({ numberOfElements });
  }

  // eslint-disable-next-line class-methods-use-this
  buildColumns(helper) {
    console.log("debug layer4 EvelogFlows buildColumns on:");
    const isRuntimeSort = helper.isRuntimeFieldEnable();
    return {
      timestamp: {
        label: 'Timestamp',
        width: '20%',
        isSortable: true,
      },
      proto: {
        label: 'Protocol',
        width: '10%',
        isSortable: isRuntimeSort,
      },
      src_ip: {
        label: 'Src IP',
        width: '20%',
        isSortable: true,
      },
      src_port: {
        label: 'Src Port',
        width: '15%',
        isSortable: true,
      },
      dest_ip: {
        label: 'Dest IP',
        width: '20%',
        isSortable: false,
      },
      dest_port: {
        label: 'Dest Port',
        width: '15%',
        isSortable: true,
      },
    };
  }

  renderLines(paginationOptions) {
    const {
      sortBy,
      orderAsc,
      searchTerm,
      filters,
      openExports,
      numberOfElements,
      selectedElements,
      selectAll,
      eventTypes,
    } = this.state;
    let numberOfSelectedElements = Object.keys(selectedElements || {}).length;
    if (selectAll) {
      numberOfSelectedElements = numberOfElements.original;
    }
    let finalFilters = filters;
    finalFilters = R.assoc(
      'event_type',
      eventTypes.length > 0
        ? R.map((n) => ({ id: n, value: n }), eventTypes)
        : [{ id: 'flow', value: 'flow' }],
      finalFilters,
    );
    console.log("debug layer4 EvelogFlows renderLines on:");
    return (
      <UserContext.Consumer>
        {({ helper }) => (
          <div>
            <ListLines
              sortBy={sortBy}
              orderAsc={orderAsc}
              dataColumns={this.buildColumns(helper)}
              handleSort={this.handleSort.bind(this)}
              handleSearch={this.handleSearch.bind(this)}
              handleAddFilter={this.handleAddFilter.bind(this)}
              handleRemoveFilter={this.handleRemoveFilter.bind(this)}
              handleToggleExports={this.handleToggleExports.bind(this)}
              openExports={openExports}
              handleToggleSelectAll={this.handleToggleSelectAll.bind(this)}
              selectAll={selectAll}
              exportEntityType="Stix-Cyber-Observable"
              exportContext={null}
              keyword={searchTerm}
              filters={filters}
              iconExtension={true}
              paginationOptions={paginationOptions}
              numberOfElements={numberOfElements}
              availableFilterKeys={[
                'in_iface',
                'flow_id',
                'dest_port',
                'event_type',
                'proto',
              ]}
            >
              <QueryRenderer
                query={evelogFlowsLinesQuery}
                variables={{ count: 25, ...paginationOptions }}
                render={({ props }) => (
                  <EvelogFlowsLines
                    data={props}
                    paginationOptions={paginationOptions}
                    dataColumns={this.buildColumns(helper)}
                    initialLoading={props === null}
                    onLabelClick={this.handleAddFilter.bind(this)}
                    selectedElements={selectedElements}
                    onToggleEntity={this.handleToggleSelectEntity.bind(this)}
                    selectAll={selectAll}
                    setNumberOfElements={this.setNumberOfElements.bind(this)}
                  />
                )}
              />
            </ListLines>
            <ToolBar
              selectedElements={selectedElements}
              numberOfSelectedElements={numberOfSelectedElements}
              selectAll={selectAll}
              filters={finalFilters}
              search={searchTerm}
              handleClearSelectedElements={this.handleClearSelectedElements.bind(
                this,
              )}
              withPaddingRight={true}
            />
          </div>
        )}
      </UserContext.Consumer>
    );
  }

  render() {
    const { classes } = this.props;
    const {
      view,
      eventTypes,
      sortBy,
      orderAsc,
      searchTerm,
      filters,
      openExports,
    } = this.state;
    const finalFilters = convertFilters(filters);
    const paginationOptions = {
      types: eventTypes.length > 0 ? eventTypes : "flow",
      search: searchTerm,
      filters: finalFilters,
      orderBy: sortBy,
      orderMode: orderAsc ? 'asc' : 'desc',
    };
    return (
      <div className={classes.container}>
        {view === 'lines' ? this.renderLines(paginationOptions) : ''}
        <Security needs={[KNOWLEDGE_KNUPDATE]}>
        </Security>
        <EvelogFlowsRightBar
          types={eventTypes}
          handleToggle={this.handleToggle.bind(this)}
          handleClear={this.handleClear.bind(this)}
          openExports={openExports}
        />
      </div>
    );
  }
}

EvelogFlows.propTypes = {
  classes: PropTypes.object,
  t: PropTypes.func,
  history: PropTypes.object,
  location: PropTypes.object,
};

export default R.compose(
  inject18n,
  withRouter,
  withStyles(styles),
)(EvelogFlows);
