System.register(['moment', 'lodash'], function(exports_1) {
    var moment_1, lodash_1;
    var IPMDatasource;
    return {
        setters:[
            function (moment_1_1) {
                moment_1 = moment_1_1;
            },
            function (lodash_1_1) {
                lodash_1 = lodash_1_1;
            }],
        execute: function() {
            IPMDatasource = (function () {
                function IPMDatasource(instanceSettings, $q, backendSrv, templateSrv, alertSrv) {
                    this.$q = $q;
                    this.backendSrv = backendSrv;
                    this.templateSrv = templateSrv;
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
                IPMDatasource.prototype.query = function (options) {
                    var _this = this;
                    var self = this;
                    var rangeFrom = moment_1.default(options.range.from).utc().utcOffset(self.tzOffset).format('YYYYMMDDTHHmmss');
                    var rangeTo = moment_1.default(options.range.to).utc().utcOffset(self.tzOffset).format('YYYYMMDDTHHmmss');
                    var requests = lodash_1.default.map(options.targets, function (target) {
                        if (target.timeRangeAttribute === 'current') {
                            rangeFrom = '';
                            rangeTo = '';
                        }
                        var refId = Math.floor(new Date().valueOf() * Math.random());
                        return {
                            url: _this.url + '/datasources/' + encodeURIComponent(target.target) + '/datasets/' + target.AttributeGroup + '/items',
                            alias: _this.templateSrv.replace(target.alias, options.scopedVars),
                            valueAttribute: target.valueAttribute,
                            format: target.format,
                            params: {
                                param_SourceToken: _this.templateSrv.replace(target.AgentInstance, options.scopedVars),
                                optimize: 'true',
                                param_Time: rangeFrom + '--' + rangeTo,
                                properties: _this.templateSrv.replace(target.Attribute, options.scopedVars) + ',' + target.timeAttribute + ',' + (target.PrimaryKey || ''),
                                condition: _this.templateSrv.replace(target.Condition, options.scopedVars),
                                param_refId: refId,
                                param_Refresh: 1,
                                param_Limit: _this.rowsLimit
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
                        self.$q.all(promises).then(function (data) {
                            data.forEach(function (result) {
                                if (typeof result.message == "undefined" && result.status == 200) {
                                    mergedResults.data = mergedResults.data.concat(self.parse(result));
                                }
                                else {
                                    result.message = "Server Response: " + result.status + ", Message: " + result.message;
                                    reject(result);
                                }
                            });
                            resolve(mergedResults);
                        });
                    });
                };
                IPMDatasource.prototype.getProviderVersion = function () {
                    return this.providerVersion;
                };
                IPMDatasource.prototype.getAgentTypes = function () {
                    var request = {
                        url: this.url + '/datasources'
                    };
                    return this.doSimpleHttpGet(request);
                };
                IPMDatasource.prototype.getAttributeGroups = function (agentType) {
                    var request = {
                        url: this.url + '/datasources/' + encodeURIComponent(agentType) + '/datasets'
                    };
                    return this.doSimpleHttpGet(request);
                };
                IPMDatasource.prototype.getAgentInstances = function (agentType) {
                    var _this = this;
                    var agents = [];
                    var request = {
                        url: this.url + '/datasources/' + encodeURIComponent(agentType) + '/datasets/msys/items?properties=all'
                    };
                    return this.httpGet(request)
                        .then(function (result) {
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
                            }
                            else {
                                return [];
                            }
                        }
                        else {
                            _this.alertSrv.set("Data source problem", "Server response: " + result.status, "error");
                            return [];
                        }
                    });
                };
                IPMDatasource.prototype.metricFindQuery = function (agentType) {
                    var _this = this;
                    var agents = [];
                    var request = {
                        url: this.url + '/datasources/' + encodeURIComponent(agentType) + '/datasets/msys/items?properties=all'
                    };
                    return this.httpGet(request)
                        .then(function (result) {
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
                            }
                            else {
                                return [];
                            }
                        }
                        else {
                            _this.alertSrv.set("Data source problem", "Server response: " + result.status, "error");
                            return [];
                        }
                    });
                };
                IPMDatasource.prototype.getAttributes = function (agentType, attributeGroup) {
                    var request = {
                        url: this.url + '/datasources/' + encodeURIComponent(agentType) + '/datasets/' + encodeURIComponent(attributeGroup) + '/columns'
                    };
                    return this.doSimpleHttpGet(request);
                };
                IPMDatasource.prototype.getPrimaryKey = function (agentType, attributeGroup) {
                    var ids = [];
                    var request = {
                        url: this.url + '/datasources/' + encodeURIComponent(agentType) + '/datasets/' + encodeURIComponent(attributeGroup) + '/columns'
                    };
                    return this.httpGet(request)
                        .then(function (result) {
                        var items = result.response.items;
                        items.forEach(function (item) {
                            if (item.primaryKey) {
                                ids.push({ id: item.id, label: item.label });
                            }
                        });
                        return ids;
                    });
                };
                IPMDatasource.prototype.testDatasource = function () {
                    return this.httpGet({ url: this.url }).then(function (result) {
                        if (result.status == 200) {
                            return { status: "success", message: "Data source connected", title: "Success" };
                        }
                        else {
                            return { status: "error", message: "Data source connection problem. Server response code: " + result.status, title: "Error" };
                        }
                    });
                };
                IPMDatasource.prototype.parse = function (results) {
                    var self = this;
                    var targetData = [];
                    var items = results.response.items;
                    var seriesList = [];
                    if (results.format === 'table') {
                        items.forEach(function (item) {
                            item.alias = results.alias;
                            item.valueAttribute = results.valueAttribute;
                            item.format = results.format;
                        });
                        var metricList = [];
                        if (items[0].properties.length > 2 && items[0].properties[items[0].properties.length - 2].valueType == 'isodatetime') {
                            for (var i = 0; i < items[0].properties.length - 2; i++) {
                                metricList.push(items[0].properties[i].id);
                            }
                        }
                        else if (items[0].properties.length > 1 && items[0].properties[items[0].properties.length - 1].valueType == 'isodatetime') {
                            for (var i = 0; i < items[0].properties.length - 1; i++) {
                                metricList.push(items[0].properties[i].id);
                            }
                        }
                        else {
                            for (var i = 0; i < items[0].properties.length; i++) {
                                metricList.push(items[0].properties[i].id);
                            }
                        }
                        seriesList.push({
                            "columns": self.getColumns(metricList),
                            "rows": self.getDatapointsTable(items),
                            "type": "table"
                        });
                        return seriesList;
                    }
                    else {
                        if (items.length > 0 && typeof items[0].properties[items[0].properties.length - 2] !== 'undefined') {
                            items.forEach(function (item) {
                                item.alias = results.alias;
                                item.valueAttribute = results.valueAttribute;
                            });
                            if (items[0].properties[items[0].properties.length - 1].valueType !== 'isodatetime') {
                                items.forEach(function (item) {
                                    targetData.push(item.properties[items[0].properties.length - 1].value);
                                });
                                //list of item instances like CPUID
                                var targets = targetData.reduce(function (a, b) {
                                    if (a.indexOf(b) < 0)
                                        a.push(b);
                                    return a;
                                }, []);
                                var metricList = [];
                                for (var i = 0; i < items[0].properties.length - 2; i++) {
                                    metricList.push(items[0].properties[i].id);
                                }
                                var seriesList = [];
                                targets.forEach(function (target) {
                                    for (var i = 0; i < metricList.length; i++) {
                                        seriesList.push({
                                            target: self.getTarget(items, i, target),
                                            datapoints: self.getDatapoints(items, i, target)
                                        });
                                    }
                                });
                            }
                            else {
                                var seriesList = [];
                                var metricList = [];
                                for (var i = 0; i < items[0].properties.length - 1; i++) {
                                    metricList.push(items[0].properties[i].id);
                                }
                                for (var i = 0; i < metricList.length; i++) {
                                    seriesList.push({
                                        target: self.getTarget(items, i, metricList[i]),
                                        datapoints: self.getDatapointsWithoutGroupBy(items, i, metricList[i])
                                    });
                                }
                            }
                        }
                        else {
                            var seriesList = [];
                            seriesList.push({
                                target: '',
                                datapoints: []
                            });
                        }
                        return seriesList;
                    }
                };
                IPMDatasource.prototype.getColumns = function (columnsDict) {
                    var columns = [];
                    for (var _i = 0, _a = (columnsDict); _i < _a.length; _i++) {
                        var column = _a[_i];
                        columns.push({ text: column, type: "string" });
                    }
                    return columns;
                };
                IPMDatasource.prototype.getDatapoints = function (items, i, target) {
                    var series = [];
                    var tzOffset = this.tzOffset;
                    items.forEach(function (item) {
                        if (item.properties[item.properties.length - 1].value == target) {
                            if (item.properties[i].valueType == "string" || item.properties[i].valueType == "isodatetime") {
                                series.push([item.properties[i][item.valueAttribute], moment_1.default(item.properties[item.properties.length - 2].value + tzOffset).valueOf()]);
                            }
                            else {
                                series.push([parseFloat(item.properties[i][item.valueAttribute]), moment_1.default(item.properties[item.properties.length - 2].value + tzOffset).valueOf()]);
                            }
                        }
                    });
                    return series;
                };
                IPMDatasource.prototype.getDatapointsWithoutGroupBy = function (items, i, target) {
                    var series = [];
                    var tzOffset = this.tzOffset;
                    items.forEach(function (item) {
                        if (item.properties[i].id == target) {
                            if (item.properties[i].valueType == "string" || item.properties[i].valueType == "isodatetime") {
                                series.push([item.properties[i][item.valueAttribute], moment_1.default(item.properties[item.properties.length - 1].value + tzOffset).valueOf()]);
                            }
                            else {
                                series.push([parseFloat(item.properties[i][item.valueAttribute]), moment_1.default(item.properties[item.properties.length - 1].value + tzOffset).valueOf()]);
                            }
                        }
                    });
                    return series;
                };
                IPMDatasource.prototype.getDatapointsTable = function (items) {
                    var series = [];
                    var rows = [];
                    var tzOffset = this.tzOffset;
                    items.forEach(function (item) {
                        item.properties.forEach(function (property) {
                            if (item.valueAttribute == 'displayValue') {
                                if (property.displayValue) {
                                    rows.push(property.displayValue);
                                }
                            }
                            else {
                                rows.push(property.value);
                            }
                        });
                        if (rows.length > 2 && rows[rows.length - 2].valueType == "isodatetime") {
                            rows.splice(rows.length - 1, 2);
                        }
                        else if (rows.length > 1 && rows[rows.length - 1].valueType == "isodatetime") {
                            rows.splice(rows.length - 1, 1);
                        }
                        series.push(rows);
                        rows = [];
                    });
                    return series;
                };
                IPMDatasource.prototype.getTarget = function (items, i, value) {
                    var alias_array = items[0].alias.split(',');
                    if (value || value == 0) {
                        if (alias_array[i] && alias_array[i] != '-') {
                            return alias_array[i] + ":" + value;
                        }
                        else if (alias_array[i] == '-') {
                            return value;
                        }
                        else {
                            return items[0].properties[i].id + ":" + value;
                        }
                    }
                    else {
                        if (alias_array[i]) {
                            return items[0].alias;
                        }
                        else {
                            return items[0].properties[i].id;
                        }
                    }
                };
                IPMDatasource.prototype.httpGet = function (request) {
                    var self = this;
                    var options = {
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
                                var options = {
                                    method: "delete",
                                    url: urlForDelete,
                                    params: request.params,
                                    headers: result.headers
                                };
                                self.backendSrv.datasourceRequest(options);
                            }
                            return { response: result.data, alias: request.alias, valueAttribute: request.valueAttribute, format: request.format, status: result.status };
                        }
                    }, function (err) {
                        if (err.status != 200) {
                            return { message: err.data.msgText, stack: err.data, config: err.config, status: err.status };
                        }
                    });
                };
                IPMDatasource.prototype.doSimpleHttpGet = function (request) {
                    return this.httpGet(request)
                        .then(function (result) {
                        if (result.response.items) {
                            return result.response.items;
                        }
                        else {
                            return [];
                        }
                    });
                };
                return IPMDatasource;
            })();
            exports_1("IPMDatasource", IPMDatasource);
        }
    }
});
//# sourceMappingURL=datasource.js.map