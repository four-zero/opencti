import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { graphql, createFragmentContainer } from 'react-relay';
import withStyles from '@mui/styles/withStyles';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { KeyboardArrowRight } from '@mui/icons-material';
import { HexagonOutline } from 'mdi-material-ui';
import { compose, pathOr } from 'ramda';
import Checkbox from '@mui/material/Checkbox';
import Skeleton from '@mui/material/Skeleton';
import inject18n from '../../../../components/i18n';
import StixCoreObjectLabels from '../../common/stix_core_objects/StixCoreObjectLabels';
import ItemMarkings from '../../../../components/ItemMarkings';

const styles = (theme) => ({
  item: {
    paddingLeft: 10,
    height: 50,
  },
  itemIcon: {
    color: theme.palette.primary.main,
  },
  bodyItem: {
    height: 20,
    fontSize: 13,
    float: 'left',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  goIcon: {
    position: 'absolute',
    right: -10,
  },
  itemIconDisabled: {
    color: theme.palette.grey[700],
  },
  placeholder: {
    display: 'inline-block',
    height: '1em',
    backgroundColor: theme.palette.grey[700],
  },
});

class EvelogFlowLineComponent extends Component {
  render() {
    const {
      t,
      nsdt,
      classes,
      dataColumns,
      node,
      onLabelClick,
      onToggleEntity,
      selectedElements,
      selectAll,
    } = this.props;
    console.log("debug node")
    console.log(node)
    return (
      <ListItem
        classes={{ root: classes.item }}
        divider={true}
        button={true}
        component={Link}
        to={`/dashboard/layer4/${
          node.event_type === 'Artifact' ? 'flows' : 'flows'
        }/${node.flow_id}`}
      >
        <ListItemIcon
          classes={{ root: classes.itemIcon }}
          style={{ minWidth: 40 }}
          onClick={onToggleEntity.bind(this, node)}
        >
          <Checkbox
            edge="start"
            checked={selectAll || node.flow_id in (selectedElements || {})}
            disableRipple={true}
          />
        </ListItemIcon>
        <ListItemIcon classes={{ root: classes.itemIcon }}>
          <HexagonOutline />
        </ListItemIcon>
        <ListItemText
          primary={
            <div>
              <div
                className={classes.bodyItem}
                style={{ width: dataColumns.timestamp.width }}
              >
                {nsdt(node.timestamp)}
              </div>
              <div
                className={classes.bodyItem}
                style={{ width: dataColumns.proto.width }}
              >
                {node.proto}
              </div>
              <div
                className={classes.bodyItem}
                style={{ width: dataColumns.dest_ip.width }}
              >
                {node.dest_ip}
              </div>
              <div
                className={classes.bodyItem}
                style={{ width: dataColumns.dest_port.width }}
              >
                {node.dest_port}
              </div>
              <div
                className={classes.bodyItem}
                style={{ width: dataColumns.src_ip.width }}
              >
                {node.src_ip}
              </div>
              <div
                className={classes.bodyItem}
                style={{ width: dataColumns.src_port.width }}
              >
                {node.src_port}
              </div>
            </div>
          }
        />
        <ListItemIcon classes={{ root: classes.goIcon }}>
          <KeyboardArrowRight />
        </ListItemIcon>
      </ListItem>
    );
  }
}

EvelogFlowLineComponent.propTypes = {
  dataColumns: PropTypes.object,
  node: PropTypes.object,
  classes: PropTypes.object,
  nsdt: PropTypes.func,
  t: PropTypes.func,
  onLabelClick: PropTypes.func,
  onToggleEntity: PropTypes.func,
  selectedElements: PropTypes.object,
  selectAll: PropTypes.bool,
};

const EvelogFlowLineFragment = createFragmentContainer(
  EvelogFlowLineComponent,
  {
    node: graphql`
      fragment EvelogFlowLine_node on EvelogFlow {
        timestamp
        proto
        src_ip
        src_port
        dest_ip
        dest_port
      }
    `,
  },
);

export const EvelogFlowLine = compose(
  inject18n,
  withStyles(styles),
)(EvelogFlowLineFragment);

class EvelogFlowLineDummyComponent extends Component {
  render() {
    const { classes, dataColumns } = this.props;
    return (
      <ListItem classes={{ root: classes.item }} divider={true}>
        <ListItemIcon
          classes={{ root: classes.itemIconDisabled }}
          style={{ minWidth: 40 }}
        >
          <Checkbox edge="start" disabled={true} disableRipple={true} />
        </ListItemIcon>
        <ListItemIcon classes={{ root: classes.itemIcon }}>
          <Skeleton
            animation="wave"
            variant="circular"
            width={30}
            height={30}
          />
        </ListItemIcon>
        <ListItemText
          primary={
            <div>
              <div
                className={classes.bodyItem}
                style={{ width: dataColumns.timestamp.width }}
              >
                <Skeleton
                  animation="wave"
                  variant="rectangular"
                  width={100}
                  height="100%"
                />
              </div>
              <div
                className={classes.bodyItem}
                style={{ width: dataColumns.proto.width }}
              >
                <Skeleton
                  animation="wave"
                  variant="rectangular"
                  width={100}
                  height="100%"
                />
              </div>
              <div
                className={classes.bodyItem}
                style={{ width: dataColumns.src_ip.width }}
              >
                <Skeleton
                  animation="wave"
                  variant="rectangular"
                  width={100}
                  height="100%"
                />
              </div>
              <div
                className={classes.bodyItem}
                style={{ width: dataColumns.src_port.width }}
              >
                <Skeleton
                  animation="wave"
                  variant="rectangular"
                  width={100}
                  height="100%"
                />
              </div>
              <div
                className={classes.bodyItem}
                style={{ width: dataColumns.dest_ip.width }}
              >
                <Skeleton
                  animation="wave"
                  variant="rectangular"
                  width={100}
                  height="100%"
                />
              </div>
              <div
                className={classes.bodyItem}
                style={{ width: dataColumns.dest_port.width }}
              >
                <Skeleton
                  animation="wave"
                  variant="rectangular"
                  width={100}
                  height="100%"
                />
              </div>
            </div>
          }
        />
        <ListItemIcon classes={{ root: classes.goIcon }}>
          <KeyboardArrowRight />
        </ListItemIcon>
      </ListItem>
    );
  }
}

EvelogFlowLineDummyComponent.propTypes = {
  dataColumns: PropTypes.object,
  classes: PropTypes.object,
};

export const EvelogFlowLineDummy = compose(
  inject18n,
  withStyles(styles),
)(EvelogFlowLineDummyComponent);
