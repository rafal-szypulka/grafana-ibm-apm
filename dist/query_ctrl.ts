///<reference path="../typings/tsd.d.ts" />
import { QueryCtrl } from 'app/plugins/sdk';
import _ from 'lodash';

class IPMQueryCtrl extends QueryCtrl {
  static templateUrl = 'partials/query.editor.html';
  refresh: any;
  metric_types: any;
  datasource: any;
  type: any;
  at: any[];  //Agent Types
  ag: any[];  //Attribute Groups for Agent Type
  atr: any[];  //Attributes for Attribute Group
  pk: any[];  //Primary Key for Attribute Group
  showPrimaryKey: boolean;
  attrSegments: any[];
  uiSegmentSrv: any;


  timeAttributes = [
    { name: 'TIMESTAMP', value: 'TIMESTAMP' },
    { name: 'WRITETIME', value: 'WRITETIME' }
  ];

  valueAttributes = [
    { name: 'value', value: 'value' },
    { name: 'displayValue', value: 'displayValue' }
  ];

  timeRangeAttributes = [
    { name: 'Dashboard time range', value: 'dashboard' },
    { name: 'Current value', value: 'current' }
  ];

  formats = [
    { name: 'timeserie', value: 'timeserie' },
    { name: 'table', value: 'table' },
  ]

  /** @ngInject **/
  constructor($scope, $injector, uiSegmentSrv, $q) {

    super($scope, $injector);
    let target_defaults = {
      target: 'Select Agent Type...',
      AttributeGroup: 'Select AttributeGroup...',
      PrimaryKey: 'Select Display Item...',
      AgentInstance: 'Select Agent...'
    }
    _.defaultsDeep(this.target, target_defaults);
    this.uiSegmentSrv = uiSegmentSrv;
    this.target.timeAttribute = this.target.timeAttribute || 'WRITETIME';
    this.target.valueAttribute = this.target.valueAttribute || 'displayValue';
    this.target.timeRangeAttribute = this.target.timeRangeAttribute || 'dashboard';
    this.target.format = this.target.format || 'table';
    this.target.Attribute = this.target.Attribute || '';
    this.target.alias = this.target.alias || this.target.Attribute;
    this.setAttrSegments();

  };
  
  setAttrSegments() {
    this.attrSegments = [];
    if(this.target.Attribute) {
      var Attributes = this.target.Attribute.split(",");
      Attributes.forEach(col => {
        this.attrSegments.push(this.uiSegmentSrv.newSegment({ value: col }));
      });
    }
    this.attrSegments.push(this.uiSegmentSrv.newPlusButton());
  }

  attrSegmentUpdated(col,index) {
    var aliases = this.target.alias.split(",");
    var Attributes = this.target.Attribute.split(",");
    Attributes[index] = col.value;
    aliases[index] = col.value;
    if(col.value == "-- remove --") {
      Attributes.splice(index, 1);
      aliases.splice(index, 1);
    }
    this.target.Attribute = Attributes.toString();
    this.setAttrSegments();
    this.target.alias = aliases.toString();
    this.refresh();
    return;
  }

  getAgentTypes() {
    if (this.at) {
      return Promise.resolve(this.at);
    } else {
      return this.datasource.getAgentTypes()
        .then(items => {
          return items.sort(function (a, b) {
            return (a.description > b.description ? 1 : -1);
          })
        });
    }
  }

  AgentTypes() {
    return this.getAgentTypes().then(items => {
      return _.map(items, item => {
        return { text: item.description, value: item.id };
      });
    });
  }

  getAttributeGroups() {
    let target = this.target.target;
    return this.datasource.getAttributeGroups(target)
      .then(items => {
        return items.sort(function (a, b) {
          return (a.description > b.description ? 1 : -1);
        })
      });
  }

  AttributeGroups() {
    return this.getAttributeGroups().then(items => {
      var filtered = items.filter(item => item.notAvailableInPreFetch != true);
      return filtered.map(item => {
        return { text: item.description, value: item.id };
      })
    });
  }

  getAgentInstances() {
    let name = this.target.target;
    return this.datasource.getAgentInstances(name)
      .then(items => {
        return items.sort(function (a, b) {
          return (a.text < b.text ? 1 : -1);
        })
      });
  }

  AgentInstances() {
    return this.getAgentInstances().then(items => {
      return _.map(items, item => {
        return { text: item.value, value: item.value };
      })
    });
  }

  getAttributes() {
    let target = this.target.target;
    let aG = this.target.AttributeGroup;
    return this.datasource.getAttributes(target, aG)
      .then(items => {
        //console.log(items);
        items.push({ label: '-- remove --', id: '-- remove --' });
        return items.sort(function (a, b) {
          return (a.label > b.label ? 1 : -1);
        });
      });
  }

  Attributes() {
    return this.getAttributes().then(items => {
      return _.map(items, item => {
        return { text: item.id, value: item.id };
      });
    }).then(this.uiSegmentSrv.transformToSegments(false));
  }

  getPrimaryKey() {
    let target = this.target.target;
    let aG = this.target.AttributeGroup;
    return this.datasource.getPrimaryKey(target, aG).then(items => {
      //items.push({ label: '--', id: '' });
      this.pk = items.sort(function (a, b) {
        return (a.label > b.label ? 1 : -1);
      });
      return items;
    });
  }

  PrimaryKey() {
    return this.getPrimaryKey().then(items => {
      return _.map(items, item => {
        return { text: item.label, value: item.id };
      });
    });
  }

  onChangeInternal() {
    this.refresh();
  }

  onChangeTimeRange() {
    if (this.target.timeRangeAttribute === 'current') {
      this.target.timeAttribute = 'TIMESTAMP';
      this.refresh();
    }
  }

  onChangeAttributeGroup() {
    this.getPrimaryKey().then(items => {
      if (_.isEmpty(this.pk)) {
        this.showPrimaryKey = false;
      } else {
        this.showPrimaryKey = true;
      }
    });
  }
}


export { IPMQueryCtrl };
