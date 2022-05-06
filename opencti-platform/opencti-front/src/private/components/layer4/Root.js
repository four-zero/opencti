import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { Switch, Redirect } from 'react-router-dom';
import { BoundaryRoute } from '../Error';
import EvelogFlows from './EvelogFlows';

class Root extends Component {
  render() {
    const { me } = this.props;
    return (
      <Switch>
        <BoundaryRoute
          exact
          path="/dashboard/layer4"
          render={() => <Redirect to="/dashboard/layer4/flows" />}
        />
        <BoundaryRoute
          exact
          path="/dashboard/layer4/flows"
          component={EvelogFlows}
        />
        {/*
        <BoundaryRoute
          path="/dashboard/layer4/netflows/:communityId"
          render={(routeProps) => (
            <RootNetflow {...routeProps} me={me} />
          )}
        />
        */}
      </Switch>
    );
  }
}

Root.propTypes = {
  me: PropTypes.object,
};

export default Root;
