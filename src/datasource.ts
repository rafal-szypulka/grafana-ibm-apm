///<reference path="../typings/tsd.d.ts" />
import moment from 'moment';
import _ from 'lodash';

class IPMDatasource {
  name: string;
  url: string;
  appId: any;
  pk: any;
  alertSrv: any;
  tzOffset: string;
  sendHttpDelete: boolean;
  providerVersion: string;

  constructor(instanceSettings, private $q, private backendSrv, private templateSrv, alertSrv) {
    this.name = instanceSettings.name;
    this.backendSrv = backendSrv;
    this.url = instanceSettings.url;
    this.alertSrv = alertSrv;
    this.tzOffset = instanceSettings.jsonData.tzOffset;
    this.providerVersion = instanceSettings.jsonData.providerVersion;
    this.sendHttpDelete = instanceSettings.jsonData.sendHttpDelete;
     if (this.providerVersion == "8x") {
         this.tzOffset = '';
     }
  }

  query(options) {
    var self = this;
    var rangeFrom = moment(options.range.from).utc().utcOffset(self.tzOffset).format('YYYYMMDDTHHmmss');
    var rangeTo = moment(options.range.to).utc().utcOffset(self.tzOffset).format('YYYYMMDDTHHmmss');
    //this.alertSrv.set("date range",rangeFrom + ' -- ' + rangeTo + ' -- ' + self.tzOffset,"error");

    var requests = _.map(options.targets, target => {
      if (target.timeRangeAttribute === 'current') {
        rangeFrom = '';
        rangeTo = '';
      }
      var refId = Math.floor(new Date().valueOf()* Math.random());
      return {
        url: this.url + '/datasources/' + encodeURIComponent(target.target) + '/datasets/' + target.AttributeGroup + '/items',
        alias: this.templateSrv.replace(target.alias, options.scopedVars),
        valueAttribute: target.valueAttribute,
        params: {
          param_SourceToken: this.templateSrv.replace(target.AgentInstance, options.scopedVars),
          optimize: 'true',
          param_Time: rangeFrom + '--' + rangeTo,
          properties: this.templateSrv.replace(target.Attribute, options.scopedVars) + ',' + target.timeAttribute + ',' + (target.PrimaryKey || ''),
          condition: this.templateSrv.replace(target.Condition, options.scopedVars),
          param_refId: refId
          // param_Time_Summarized: 'H'
        }
      };
    });

    // delete condition parameter if empty because it throws an exception when empty :/
    requests.forEach(function (request) {
      if (request.params.condition === '') {
        delete request.params.condition;
      }
      if (request.params.param_Time === '--') {
        delete request.params.param_Time;
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
          if (typeof result.message == "undefined" && result.status == 200) {
            mergedResults.data = mergedResults.data.concat(self.parse(result));
          } else {
            result.message = "Server Response: " + result.status + ", Message: " + result.message;
            reject(result);
          }
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
    var agents = [];
    var aT = agentType.replace(/^.*-->  /, '');
    let request = {
      url: this.url + '/datasources/' + encodeURIComponent(aT) + '/datasets/msys/items?properties=all'
    };

    return this.httpGet(request)
      .then(result => {
        if (typeof result.message == "undefined" && result.status == 200) {
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
            return agents;
          } else {
            return [];
          }
        } else {
          this.alertSrv.set("Data source problem", "Server response: " + result.status, "error");
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
        if (typeof result.message == "undefined" && result.status == 200) {
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
            return agents;
          } else {
            return [];
          }
        } else {
          this.alertSrv.set("Data source problem", "Server response: " + result.status, "error");
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
    return this.httpGet({ url: this.url }).then(result => {
      if (result.status == 200) {
        return { status: "success", message: "Data source connected", title: "Success" };
      } else {
        return { status: "error", message: "Data source connection problem. Server response code: " + result.status, title: "Error" };
      }
    });
  }

  parse(results) {
    var self = this;
    var targetData = [];
    var items = results.response.items;
    if (items.length > 0 && typeof items[0].properties[1] !== 'undefined') {
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
    //console.log(seriesList);
    return seriesList;
  }

  getDatapoints(items, target) {
    var series = [];
    var tzOffset = this.tzOffset;
    if (target || target == 0) {
      items.forEach(function (item) {
        if (item.properties[2].value == target) {
            if (item.properties[0].valueType == "string" || item.properties[0].valueType == "isodatetime") {
                series.push([item.properties[0][item.valueAttribute], moment(item.properties[1].value + tzOffset).valueOf()]);
            } else {
                series.push([parseFloat(item.properties[0][item.valueAttribute]), moment(item.properties[1].value + tzOffset).valueOf()]);
          }
      }
      });
    } else {
      items.forEach(function (item) {
           if (item.properties[0].valueType == "string" || item.properties[0].valueType == "isodatetime") {
                series.push([item.properties[0][item.valueAttribute], moment(item.properties[1].value + tzOffset).valueOf()]);
          } else {
                series.push([parseFloat(item.properties[0][item.valueAttribute]), moment(item.properties[1].value + tzOffset).valueOf()]);
            }
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
      if (items[0].alias) {
        return items[0].alias;
      } else {
        return items[0].properties[0].id;
      }
    }
  }

  httpGet(request) {
    var self = this;
    var options: any = {
      method: "get",
      url: request.url,
      params: request.params,
      data: request.data,
    };
    var urlReplaced = request.url.search(/\/items/) >= 0;

    return this.backendSrv.datasourceRequest(options).then(function (result) {
      if (result.status == 200) {
        if (urlReplaced && self.sendHttpDelete) {
          var urlForDelete = request.url.replace(/\/items/, '');
          var options: any = {
            method: "delete",
            url: urlForDelete,
            params: request.params,
          };
          self.backendSrv.datasourceRequest(options);
        }
        return { response: result.data, alias: request.alias, valueAttribute: request.valueAttribute, status: result.status }
      }
    }, function (err) {
      if (err.status != 200) {
        return { message: err.data.msgText, stack: err.data, config: err.config, status: err.status };
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
