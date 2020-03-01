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
  rowsLimit: any;

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
    this.rowsLimit = instanceSettings.jsonData.rowsLimit;
  }
  
  query(options) {
    var self = this;
    var rangeFrom = moment(options.range.from).utc().utcOffset(self.tzOffset).format('YYYYMMDDTHHmmss');
    var rangeTo = moment(options.range.to).utc().utcOffset(self.tzOffset).format('YYYYMMDDTHHmmss');

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
        format: target.format,
        params: {
          param_SourceToken: this.templateSrv.replace(target.AgentInstance, options.scopedVars),
          optimize: 'true',
          param_Time: rangeFrom + '--' + rangeTo,
          properties: this.templateSrv.replace(target.Attribute, options.scopedVars) + ',' + target.timeAttribute + ',' + (target.PrimaryKey || ''),
          condition: this.templateSrv.replace(target.Condition, options.scopedVars),
          param_refId: refId,
          param_Refresh: 1,
          param_Limit: this.rowsLimit
        }
      };
    });

    // delete empty request parameters
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
  
  getProviderVersion() {
    return this.providerVersion;
  }

  getAgentTypes() {
    let request = {
      url: this.url + '/datasources'
    };
    return this.doSimpleHttpGet(request);
  }

  getAttributeGroups(agentType) {
    let request = {
      url: this.url + '/datasources/' + encodeURIComponent(agentType) + '/datasets'
    };
    return this.doSimpleHttpGet(request);
  }

  getAgentInstances(agentType) {
    var agents = [];
    let request = {
      url: this.url + '/datasources/' + encodeURIComponent(agentType) + '/datasets/msys/items?properties=all'
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
    let request = {
      url: this.url + '/datasources/' + encodeURIComponent(agentType) + '/datasets/msys/items?properties=all'
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
    let request = {
      url: this.url + '/datasources/' + encodeURIComponent(agentType) + '/datasets/' + encodeURIComponent(attributeGroup) + '/columns'
    };
    return this.doSimpleHttpGet(request);
  }

  getPrimaryKey(agentType, attributeGroup) {
    var ids = [];
    let request = {
      url: this.url + '/datasources/' + encodeURIComponent(agentType) + '/datasets/' + encodeURIComponent(attributeGroup) + '/columns'
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
    var seriesList = [];

    if (results.format === 'table') {
      items.forEach(item => {
        item.alias = results.alias;
        item.valueAttribute = results.valueAttribute;
        item.format = results.format;
      });

      var metricList = [];
      if (items[0].properties.length > 2 && items[0].properties[items[0].properties.length-2].valueType == 'isodatetime' ) {
        for(var i = 0; i < items[0].properties.length-2; i++) {
         metricList.push(items[0].properties[i].id);
       }
      } else if(items[0].properties.length > 1 && items[0].properties[items[0].properties.length-1].valueType == 'isodatetime' ) {
        for(var i = 0; i < items[0].properties.length-1; i++) {
          metricList.push(items[0].properties[i].id);
        }
       } else {
        for(var i = 0; i < items[0].properties.length; i++) {
          metricList.push(items[0].properties[i].id);
       }
      }
      seriesList.push({
              "columns": self.getColumns(metricList),
              "rows": self.getDatapointsTable(items),
              "type": "table"
            })
      return seriesList;
    } else {
    if (items.length > 0 && typeof items[0].properties[items[0].properties.length-2] !== 'undefined') {
      items.forEach(item => {
        item.alias = results.alias;
        item.valueAttribute = results.valueAttribute;
      });

      if (items[0].properties[items[0].properties.length-1].valueType !== 'isodatetime' ) {

        items.forEach(function (item) {
          targetData.push(item.properties[items[0].properties.length-1].value);
        });
        //list of item instances like CPUID
        var targets = targetData.reduce(function (a, b) {
          if (a.indexOf(b) < 0) a.push(b);
          return a;
        }, []);

        var metricList = [];
        for(var i = 0; i < items[0].properties.length-2; i++) {
          metricList.push(items[0].properties[i].id);
        }
        var seriesList = [];
        targets.forEach(function (target) {
          for(var i = 0; i < metricList.length; i++) {
            seriesList.push({
              target: self.getTarget(items, i, target),
              datapoints: self.getDatapoints(items, i, target)
            })
          }
        });
      } else {
        var seriesList = [];
        var metricList = [];
        for(var i = 0; i < items[0].properties.length-1; i++) {
          metricList.push(items[0].properties[i].id);
        }
        for(var i = 0; i < metricList.length; i++) {
          seriesList.push({
            target: self.getTarget(items, i, metricList[i]),
            datapoints: self.getDatapointsWithoutGroupBy(items, i, metricList[i])
          })
        }
      }
    } else {
      var seriesList = [];
      seriesList.push({
        target: '',
        datapoints: []
      })
    }
    return seriesList;
  }}

  getColumns(columnsDict) {
    let columns = [];
    for(let column of (columnsDict)) {
      columns.push({ text: column, type: "string" })
    }
    return columns;
  }

getDatapoints(items, i, target) {
    var series = [];
    var tzOffset = this.tzOffset;
    items.forEach(function (item) {
      if (item.properties[item.properties.length-1].value == target) {
        if (item.properties[i].valueType == "string" || item.properties[i].valueType == "isodatetime") {
            series.push([item.properties[i][item.valueAttribute], moment(item.properties[item.properties.length-2].value + tzOffset).valueOf()]);
        } else {
            series.push([parseFloat(item.properties[i][item.valueAttribute]), moment(item.properties[item.properties.length-2].value + tzOffset).valueOf()]);           
        }  
      }
      });
    return series;
  }

  getDatapointsWithoutGroupBy(items, i, target) {
    var series = [];
    var tzOffset = this.tzOffset;
    items.forEach(function (item) {
      if (item.properties[i].id == target) {
        if (item.properties[i].valueType == "string" || item.properties[i].valueType == "isodatetime") {
            series.push([item.properties[i][item.valueAttribute], moment(item.properties[item.properties.length-1].value + tzOffset).valueOf()]);
        } else {
            series.push([parseFloat(item.properties[i][item.valueAttribute]), moment(item.properties[item.properties.length-1].value + tzOffset).valueOf()]);           
        }  
      }
    });
    return series;
  }
  
  getDatapointsTable(items) {
    var series = [];
    var rows = [];
    var tzOffset = this.tzOffset;
    items.forEach(function (item) {
      item.properties.forEach(function (property) {
      if(item.valueAttribute == 'displayValue') {
       if(property.displayValue) {
        rows.push(property.displayValue)
       }
      } else {
        rows.push(property.value);
      }
      });

      if(rows.length > 2 && rows[rows.length-2].valueType == "isodatetime") {
       rows.splice(rows.length-1,2);
      } 
      else if (rows.length > 1 && rows[rows.length-1].valueType == "isodatetime") {
       rows.splice(rows.length-1,1);
      }
      series.push(rows);

      rows = [];
    });
    return series;
  }

  getTarget(items, i, value) {
    var alias_array = items[0].alias.split(',');
    if (value || value == 0) {
      if (alias_array[i] && alias_array[i] != '-') {
        return alias_array[i] + ":" + value;
      } else if (alias_array[i] == '-') {
        return value;
      } else {
        return items[0].properties[i].id + ":" + value;
      }
    } else {
      if (alias_array[i]) {
        return items[0].alias;
      } else {
        return items[0].properties[i].id;
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
            headers: result.headers
          };
          self.backendSrv.datasourceRequest(options);
        }
        return { response: result.data, alias: request.alias, valueAttribute: request.valueAttribute, format: request.format, status: result.status }
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
