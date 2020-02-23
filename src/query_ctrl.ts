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
  ai: any[];   //Agent Instances
  showPrimaryKey: boolean;

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
  ]

  /** @ngInject **/
  constructor($scope, $injector) {


    super($scope, $injector);
    let target_defaults = {
      target: 'Select Agent Type...',
      AttributeGroup: 'Select AttributeGroup...',
      Attribute: 'Select Attribute...',
      PrimaryKey: 'Select Display Item...',
      AgentInstance: 'Select Agent...'
    }
    _.defaultsDeep(this.target, target_defaults);
    this.target.timeAttribute = this.target.timeAttribute || 'WRITETIME';
    this.target.valueAttribute = this.target.valueAttribute || 'displayValue';
    this.target.timeRangeAttribute = this.target.timeRangeAttribute || 'dashboard';
  };

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
        return items.sort(function (a, b) {
          return (a.label > b.label ? 1 : -1);
        })
      });
  }

  Attributes() {
    return this.getAttributes().then(items => {
      return _.map(items, item => {
        return { text: item.label, value: item.id };
      });
    });
  }

  getPrimaryKey() {
    let target = this.target.target;
    let aG = this.target.AttributeGroup;
    return this.datasource.getPrimaryKey(target, aG).then(items => {
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

  onChangeAgentType() {
    this.refresh();
  }

  onChangeInternal() {
    this.refresh();
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
