System.register(['./datasource', './query_ctrl', './config_ctrl'], function(exports_1) {
    var datasource_1, query_ctrl_1, config_ctrl_1;
    var IPMQueryOptionsCtrl;
    return {
        setters:[
            function (datasource_1_1) {
                datasource_1 = datasource_1_1;
            },
            function (query_ctrl_1_1) {
                query_ctrl_1 = query_ctrl_1_1;
            },
            function (config_ctrl_1_1) {
                config_ctrl_1 = config_ctrl_1_1;
            }],
        execute: function() {
            IPMQueryOptionsCtrl = (function () {
                function IPMQueryOptionsCtrl() {
                }
                IPMQueryOptionsCtrl.templateUrl = 'partials/query.options.html';
                return IPMQueryOptionsCtrl;
            })();
            exports_1("Datasource", datasource_1.IPMDatasource);
            exports_1("QueryCtrl", query_ctrl_1.IPMQueryCtrl);
            exports_1("QueryOptionsCtrl", IPMQueryOptionsCtrl);
            exports_1("ConfigCtrl", config_ctrl_1.IPMConfigCtrl);
        }
    }
});
//# sourceMappingURL=module.js.map