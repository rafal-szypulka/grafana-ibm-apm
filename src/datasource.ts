///<reference path="../typings/tsd.d.ts" />
import moment from 'moment';
import _ from 'lodash';

class IPMDatasource {
  name: string;
  url: string;
  appId: any;
  pk: any;

  constructor(instanceSettings, private $q, private backendSrv, private templateSrv) {
    this.name = instanceSettings.name;
    this.backendSrv = backendSrv;
    this.url = instanceSettings.url;
    this.name = instanceSettings.name;
  }

  query(options) {
    var self = this;
    var rangeFrom = moment(options.range.from).utc().format('YYYYMMDDTHHmmss');
    var rangeTo = moment(options.range.to).utc().format('YYYYMMDDTHHmmss');

    var requests = _.map(options.targets, target => {
      return {
        url: this.url + '/datasources/' + encodeURIComponent(target.target) + '/datasets/' + target.AttributeGroup + '/items',
        alias: this.templateSrv.replace(target.alias, options.scopedVars),
        valueAttribute: target.valueAttribute,
        params: {
          param_SourceToken: this.templateSrv.replace(target.AgentInstance, options.scopedVars),
          clearCache: 'true',
          optimize: 'true',
          param_Time: rangeFrom + '--' + rangeTo,
          param_NoCache: 'false',
          properties: this.templateSrv.replace(target.Attribute , options.scopedVars) + ',' + target.timeAttribute + ',' + (target.PrimaryKey || ''),
          condition: this.templateSrv.replace(target.Condition, options.scopedVars),
        }
      };
    });

    // delete condition parameter if empty because it throws an exception when empty :/
    requests.forEach(function (request) {
      if (request.params.condition === '') {
        delete request.params.condition;
      }
    });

    return this.$q(function (resolve, reject) {
      var mergedResults = {
        data: []
      };
      var promises = [];
      requests.forEach(function (request) {
        promises.push(self.httpGet(request));
      });
      self.$q.all(promises).then((data) => {
        data.forEach(function (result) {
          mergedResults.data = mergedResults.data.concat(self.parse(result));
        });
        resolve(mergedResults);
      });
    });
  }

 getAgentTypes() {
    let request = {
      url: this.url + '/datasources'
    };

    return this.doSimpleHttpGet(request);
  }

  getAttributeGroups(agentType) {
    var aT = agentType.replace(/^.*-->  /, '');
    let request = {
      url: this.url + '/datasources/' + encodeURIComponent(aT) + '/datasets'
    };
    return this.doSimpleHttpGet(request);
  }

 getAgentInstances(agentType) {
    var agents = []
    var aT = agentType.replace(/^.*-->  /, '');
    let request = {
      url: this.url + '/datasources/' + encodeURIComponent(aT) + '/datasets/msys/items?properties=all'
    };

    return this.httpGet(request)
      .then(result => {
        if (result.response.items) {
          result.response.items.forEach(function (item) {
            if (item.properties) {
              item.properties.forEach(function (property) {
                if (property.id === 'ORIGINNODE') {
                  agents.push({ text: property.value, value: property.value });
                }
              });
            }
          });
          //console.log(agents);
          return agents;
        } else {
          return [];
        }
      });
  }

  metricFindQuery(agentType) {
    var agents = [];
    var aT = agentType.replace(/^.*-->  /, '');
    let request = {
      url: this.url + '/datasources/' + encodeURIComponent(aT) + '/datasets/msys/items?properties=all'
    };

    return this.httpGet(request)
      .then(result => {
        if (result.response.items) {
          result.response.items.forEach(function (item) {
            if (item.properties) {
              item.properties.forEach(function (property) {
                if (property.id === 'ORIGINNODE') {
                  agents.push({ text: property.value, value: property.value });
                }
              });
            }
          });
          //console.log(agents);
          return agents;
        } else {
          return [];
        }
      });
  }

  getAttributes(agentType, attributeGroup) {
    var aT = agentType.replace(/^.*-->  /, '');
    var aG = attributeGroup.replace(/^.*-->  /, '');
    let request = {
      url: this.url + '/datasources/' + encodeURIComponent(aT) + '/datasets/' + encodeURIComponent(aG) + '/columns'
    };

    return this.doSimpleHttpGet(request);
  }

  getPrimaryKey(agentType, attributeGroup) {
    var aT = agentType.replace(/^.*-->  /, '');
    var aG = attributeGroup.replace(/^.*-->  /, '');
    var ids = [];
    let request = {
      url: this.url + '/datasources/' + encodeURIComponent(aT) + '/datasets/' + encodeURIComponent(aG) + '/columns'
    };

    return this.httpGet(request)
      .then(result => {
        var items = result.response.items;
        items.forEach(function (item) {
          if (item.primaryKey) {
            ids.push({ id: item.id, label: item.label });
          }
        });
        return ids;
      });
  }

  testDatasource() {
    return this.httpGet({ url: this.url }).then(() => {
      return { status: "success", message: "Data source is working", title: "Success" };
    });
  }

  parse(results) {
    var self = this;
    var targetData = [];
    var items = results.response.items;
    if (items.length > 0) {
      //console.log(results);
      items.forEach(item => {
        item.alias = results.alias;
        item.valueAttribute = results.valueAttribute;
      });

      if (typeof items[0].properties[2] !== 'undefined') {
        items.forEach(function (item) {
          targetData.push(item.properties[2].value);
        });
        //list of item instances like CPUID
        var targets = targetData.reduce(function (a, b) {
          if (a.indexOf(b) < 0) a.push(b);
          return a;
        }, []);

        var seriesList = [];
        targets.forEach(function (target) {
          seriesList.push({
            target: self.getTarget(items, target),
            datapoints: self.getDatapoints(items, target)
          })
        });
      } else {
        var seriesList = [];
        seriesList.push({
          target: self.getTarget(items, null),
          datapoints: self.getDatapoints(items, null)
        })
      }
    } else {
      var seriesList = [];
      seriesList.push({
        target: '',
        datapoints: []
      })
    }
    return seriesList;
  }

  getDatapoints(items, target) {
    var series = [];
    if (target || target == 0) {
      items.forEach(function (item) {
        if (item.properties[2].value == target) {
          series.push([parseFloat(item.properties[0][item.valueAttribute]), moment(item.properties[1].value + '.000Z').valueOf()]);
        }
      });
    } else {
      items.forEach(function (item) {
        series.push([parseFloat(item.properties[0][item.valueAttribute]), moment(item.properties[1].value + '.000Z').valueOf()]);
      });
    }
    return series;
  }

  getTarget(items, value) {
    if (value || value == 0) {
      if (items[0].alias) {
        return items[0].alias + ":" + value;
      } else {
        return items[0].properties[0].id + ":" + value;
      }
    } else {
      return items[0].properties[0].id;
    }
  }

  httpGet(request) {
    var options: any = {
      method: "get",
      url: request.url,
      params: request.params,
      data: request.data,
    };

    return this.backendSrv.datasourceRequest(options).then(result => {
      return { response: result.data, alias: request.alias, valueAttribute: request.valueAttribute };
    }, function (err) {
      if (err.status !== 0 || err.status >= 300) {
        if (err.data && err.data.error) {
          throw { message: 'IPM Error Response: ' + err.data.error.title, data: err.data, config: err.config };
        } else {
          throw { message: 'IPM Error: ' + err.message, data: err.data, config: err.config };
        }
      }
    });
  }


 doSimpleHttpGet(request) {
   return this.httpGet(request)
      .then(result => {
        if (result.response.items) {
          return result.response.items;
        } else {
          return [];
        }
      });
 }

}

export { IPMDatasource };
