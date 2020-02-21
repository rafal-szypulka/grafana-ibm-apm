System.register(['app/plugins/sdk', 'lodash'], function(exports_1) {
    var __extends = (this && this.__extends) || function (d, b) {
        for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
    var sdk_1, lodash_1;
    var IPMQueryCtrl;
    return {
        setters:[
            function (sdk_1_1) {
                sdk_1 = sdk_1_1;
            },
            function (lodash_1_1) {
                lodash_1 = lodash_1_1;
            }],
        execute: function() {
            IPMQueryCtrl = (function (_super) {
                __extends(IPMQueryCtrl, _super);
                /** @ngInject **/
                function IPMQueryCtrl($scope, $injector, uiSegmentSrv, $q) {
                    _super.call(this, $scope, $injector);
                    this.timeAttributes = [
                        { name: 'TIMESTAMP', value: 'TIMESTAMP' },
                        { name: 'WRITETIME', value: 'WRITETIME' }
                    ];
                    this.valueAttributes = [
                        { name: 'value', value: 'value' },
                        { name: 'displayValue', value: 'displayValue' }
                    ];
                    this.timeRangeAttributes = [
                        { name: 'Dashboard time range', value: 'dashboard' },
                        { name: 'Current value', value: 'current' }
                    ];
                    this.formats = [
                        { name: 'timeserie', value: 'timeserie' },
                        { name: 'table', value: 'table' },
                    ];
                    var target_defaults = {
                        target: 'Select Agent Type...',
                        AttributeGroup: 'Select AttributeGroup...',
                        PrimaryKey: 'Select Display Item...',
                        AgentInstance: 'Select Agent...'
                    };
                    lodash_1.default.defaultsDeep(this.target, target_defaults);
                    this.uiSegmentSrv = uiSegmentSrv;
                    this.target.timeAttribute = this.target.timeAttribute || 'WRITETIME';
                    this.target.valueAttribute = this.target.valueAttribute || 'displayValue';
                    this.target.timeRangeAttribute = this.target.timeRangeAttribute || 'dashboard';
                    this.target.format = this.target.format || 'table';
                    this.target.Attribute = this.target.Attribute || '';
                    this.target.alias = this.target.alias || this.target.Attribute;
                    this.setAttrSegments();
                }
                ;
                IPMQueryCtrl.prototype.setAttrSegments = function () {
                    var _this = this;
                    this.attrSegments = [];
                    if (this.target.Attribute) {
                        var Attributes = this.target.Attribute.split(",");
                        Attributes.forEach(function (col) {
                            _this.attrSegments.push(_this.uiSegmentSrv.newSegment({ value: col }));
                        });
                    }
                    this.attrSegments.push(this.uiSegmentSrv.newPlusButton());
                };
                IPMQueryCtrl.prototype.attrSegmentUpdated = function (col, index) {
                    var aliases = this.target.alias.split(",");
                    var Attributes = this.target.Attribute.split(",");
                    Attributes[index] = col.value;
                    aliases[index] = col.value;
                    if (col.value == "-- remove --") {
                        Attributes.splice(index, 1);
                        aliases.splice(index, 1);
                    }
                    this.target.Attribute = Attributes.toString();
                    this.setAttrSegments();
                    this.target.alias = aliases.toString();
                    this.refresh();
                    return;
                };
                IPMQueryCtrl.prototype.getAgentTypes = function () {
                    if (this.at) {
                        return Promise.resolve(this.at);
                    }
                    else {
                        return this.datasource.getAgentTypes()
                            .then(function (items) {
                            return items.sort(function (a, b) {
                                return (a.description > b.description ? 1 : -1);
                            });
                        });
                    }
                };
                IPMQueryCtrl.prototype.AgentTypes = function () {
                    return this.getAgentTypes().then(function (items) {
                        return lodash_1.default.map(items, function (item) {
                            return { text: item.description, value: item.id };
                        });
                    });
                };
                IPMQueryCtrl.prototype.getAttributeGroups = function () {
                    var target = this.target.target;
                    return this.datasource.getAttributeGroups(target)
                        .then(function (items) {
                        return items.sort(function (a, b) {
                            return (a.description > b.description ? 1 : -1);
                        });
                    });
                };
                IPMQueryCtrl.prototype.AttributeGroups = function () {
                    return this.getAttributeGroups().then(function (items) {
                        var filtered = items.filter(function (item) { return item.notAvailableInPreFetch != true; });
                        return filtered.map(function (item) {
                            return { text: item.description, value: item.id };
                        });
                    });
                };
                IPMQueryCtrl.prototype.getAgentInstances = function () {
                    var name = this.target.target;
                    return this.datasource.getAgentInstances(name)
                        .then(function (items) {
                        return items.sort(function (a, b) {
                            return (a.text < b.text ? 1 : -1);
                        });
                    });
                };
                IPMQueryCtrl.prototype.AgentInstances = function () {
                    return this.getAgentInstances().then(function (items) {
                        return lodash_1.default.map(items, function (item) {
                            return { text: item.value, value: item.value };
                        });
                    });
                };
                IPMQueryCtrl.prototype.getAttributes = function () {
                    var target = this.target.target;
                    var aG = this.target.AttributeGroup;
                    return this.datasource.getAttributes(target, aG)
                        .then(function (items) {
                        //console.log(items);
                        items.push({ label: '-- remove --', id: '-- remove --' });
                        return items.sort(function (a, b) {
                            return (a.label > b.label ? 1 : -1);
                        });
                    });
                };
                IPMQueryCtrl.prototype.Attributes = function () {
                    return this.getAttributes().then(function (items) {
                        return lodash_1.default.map(items, function (item) {
                            return { text: item.id, value: item.id };
                        });
                    }).then(this.uiSegmentSrv.transformToSegments(false));
                };
                IPMQueryCtrl.prototype.getPrimaryKey = function () {
                    var _this = this;
                    var target = this.target.target;
                    var aG = this.target.AttributeGroup;
                    return this.datasource.getPrimaryKey(target, aG).then(function (items) {
                        //items.push({ label: '--', id: '' });
                        _this.pk = items.sort(function (a, b) {
                            return (a.label > b.label ? 1 : -1);
                        });
                        return items;
                    });
                };
                IPMQueryCtrl.prototype.PrimaryKey = function () {
                    return this.getPrimaryKey().then(function (items) {
                        return lodash_1.default.map(items, function (item) {
                            return { text: item.label, value: item.id };
                        });
                    });
                };
                IPMQueryCtrl.prototype.onChangeInternal = function () {
                    this.refresh();
                };
                IPMQueryCtrl.prototype.onChangeTimeRange = function () {
                    if (this.target.timeRangeAttribute === 'current') {
                        this.target.timeAttribute = 'TIMESTAMP';
                        this.refresh();
                    }
                };
                IPMQueryCtrl.prototype.onChangeAttributeGroup = function () {
                    var _this = this;
                    this.getPrimaryKey().then(function (items) {
                        if (lodash_1.default.isEmpty(_this.pk)) {
                            _this.showPrimaryKey = false;
                        }
                        else {
                            _this.showPrimaryKey = true;
                        }
                    });
                };
                IPMQueryCtrl.templateUrl = 'partials/query.editor.html';
                return IPMQueryCtrl;
            })(sdk_1.QueryCtrl);
            exports_1("IPMQueryCtrl", IPMQueryCtrl);
        }
    }
});
//# sourceMappingURL=query_ctrl.js.map