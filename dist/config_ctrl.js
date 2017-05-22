System.register([], function(exports_1) {
    var IPMConfigCtrl;
    return {
        setters:[],
        execute: function() {
            IPMConfigCtrl = (function () {
                function IPMConfigCtrl($scope) {
                    this.current.jsonData = this.current.jsonData || {};
                }
                IPMConfigCtrl.templateUrl = 'partials/config.html';
                return IPMConfigCtrl;
            })();
            exports_1("IPMConfigCtrl", IPMConfigCtrl);
        }
    }
});
//# sourceMappingURL=config_ctrl.js.map