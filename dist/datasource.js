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
                }
                IPMDatasource.prototype.query = function (options) {
                    var _this = this;
                    var self = this;
                    var rangeFrom = moment_1.default(options.range.from).utc().utcOffset(self.tzOffset).format('YYYYMMDDTHHmmss');
                    var rangeTo = moment_1.default(options.range.to).utc().utcOffset(self.tzOffset).format('YYYYMMDDTHHmmss');
                    //this.alertSrv.set("date range",rangeFrom + ' -- ' + rangeTo + ' -- ' + self.tzOffset,"error");
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
                            params: {
                                param_SourceToken: _this.templateSrv.replace(target.AgentInstance, options.scopedVars),
                                optimize: 'true',
                                param_Time: rangeFrom + '--' + rangeTo,
                                properties: _this.templateSrv.replace(target.Attribute, options.scopedVars) + ',' + target.timeAttribute + ',' + (target.PrimaryKey || ''),
                                condition: _this.templateSrv.replace(target.Condition, options.scopedVars),
                                param_refId: refId
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
                IPMDatasource.prototype.getAgentTypes = function () {
                    var request = {
                        url: this.url + '/datasources'
                    };
                    return this.doSimpleHttpGet(request);
                };
                IPMDatasource.prototype.getAttributeGroups = function (agentType) {
                    var aT = agentType.replace(/^.*-->  /, '');
                    var request = {
                        url: this.url + '/datasources/' + encodeURIComponent(aT) + '/datasets'
                    };
                    return this.doSimpleHttpGet(request);
                };
                IPMDatasource.prototype.getAgentInstances = function (agentType) {
                    var _this = this;
                    var agents = [];
                    var aT = agentType.replace(/^.*-->  /, '');
                    var request = {
                        url: this.url + '/datasources/' + encodeURIComponent(aT) + '/datasets/msys/items?properties=all'
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
                    var aT = agentType.replace(/^.*-->  /, '');
                    var request = {
                        url: this.url + '/datasources/' + encodeURIComponent(aT) + '/datasets/msys/items?properties=all'
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
                    var aT = agentType.replace(/^.*-->  /, '');
                    var aG = attributeGroup.replace(/^.*-->  /, '');
                    var request = {
                        url: this.url + '/datasources/' + encodeURIComponent(aT) + '/datasets/' + encodeURIComponent(aG) + '/columns'
                    };
                    return this.doSimpleHttpGet(request);
                };
                IPMDatasource.prototype.getPrimaryKey = function (agentType, attributeGroup) {
                    var aT = agentType.replace(/^.*-->  /, '');
                    var aG = attributeGroup.replace(/^.*-->  /, '');
                    var ids = [];
                    var request = {
                        url: this.url + '/datasources/' + encodeURIComponent(aT) + '/datasets/' + encodeURIComponent(aG) + '/columns'
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
                    if (items.length > 0 && typeof items[0].properties[1] !== 'undefined') {
                        items.forEach(function (item) {
                            item.alias = results.alias;
                            item.valueAttribute = results.valueAttribute;
                        });
                        if (typeof items[0].properties[2] !== 'undefined') {
                            items.forEach(function (item) {
                                targetData.push(item.properties[2].value);
                            });
                            //list of item instances like CPUID
                            var targets = targetData.reduce(function (a, b) {
                                if (a.indexOf(b) < 0)
                                    a.push(b);
                                return a;
                            }, []);
                            var seriesList = [];
                            targets.forEach(function (target) {
                                seriesList.push({
                                    target: self.getTarget(items, target),
                                    datapoints: self.getDatapoints(items, target)
                                });
                            });
                        }
                        else {
                            var seriesList = [];
                            seriesList.push({
                                target: self.getTarget(items, null),
                                datapoints: self.getDatapoints(items, null)
                            });
                        }
                    }
                    else {
                        var seriesList = [];
                        seriesList.push({
                            target: '',
                            datapoints: []
                        });
                    }
                    //console.log(seriesList);
                    return seriesList;
                };
                IPMDatasource.prototype.getDatapoints = function (items, target) {
                    var series = [];
                    var tzOffset = this.tzOffset;
                    if (target || target == 0) {
                        items.forEach(function (item) {
                            if (item.properties[2].value == target) {
                                if (item.properties[0].valueType == "string" || item.properties[0].valueType == "isodatetime") {
                                    series.push([item.properties[0][item.valueAttribute], moment_1.default(item.properties[1].value + tzOffset).valueOf()]);
                                }
                                else {
                                    series.push([parseFloat(item.properties[0][item.valueAttribute]), moment_1.default(item.properties[1].value + tzOffset).valueOf()]);
                                }
                            }
                        });
                    }
                    else {
                        items.forEach(function (item) {
                            if (item.properties[0].valueType == "string" || item.properties[0].valueType == "isodatetime") {
                                series.push([item.properties[0][item.valueAttribute], moment_1.default(item.properties[1].value + tzOffset).valueOf()]);
                            }
                            else {
                                series.push([parseFloat(item.properties[0][item.valueAttribute]), moment_1.default(item.properties[1].value + tzOffset).valueOf()]);
                            }
                        });
                    }
                    return series;
                };
                IPMDatasource.prototype.getTarget = function (items, value) {
                    if (value || value == 0) {
                        if (items[0].alias) {
                            return items[0].alias + ":" + value;
                        }
                        else {
                            return items[0].properties[0].id + ":" + value;
                        }
                    }
                    else {
                        if (items[0].alias) {
                            return items[0].alias;
                        }
                        else {
                            return items[0].properties[0].id;
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
                                };
                                self.backendSrv.datasourceRequest(options);
                            }
                            return { response: result.data, alias: request.alias, valueAttribute: request.valueAttribute, status: result.status };
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