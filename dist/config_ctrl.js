System.register([], function(exports_1) {
    var IPMConfigCtrl;
    return {
        setters:[],
        execute: function() {
            IPMConfigCtrl = (function () {
                function IPMConfigCtrl($scope) {
                    this.tzOffset = [
                        { name: 'none', value: '+0000' },
                        { name: '-1 hour', value: '-0100' },
                        { name: '-2 hours', value: '-0200' },
                        { name: '-3 hours', value: '-0300' },
                        { name: '-4 hours', value: '-0400' },
                        { name: '-5 hours', value: '-0500' },
                        { name: '-6 hours', value: '-0600' },
                        { name: '-7 hours', value: '-0700' },
                        { name: '-8 hours', value: '-0800' },
                        { name: '-9 hours', value: '-0900' },
                        { name: '-10 hours', value: '1000' },
                        { name: '-11 hours', value: '-1100' },
                        { name: '-12 hours', value: '-1200' },
                        { name: '+1 hour', value: '+0100' },
                        { name: '+2 hours', value: '+0200' },
                        { name: '+3 hours', value: '+0300' },
                        { name: '+4 hours', value: '+0400' },
                        { name: '+5 hours', value: '+0500' },
                        { name: '+6 hours', value: '+0600' },
                        { name: '+7 hours', value: '+0700' },
                        { name: '+8 hours', value: '+0800' },
                        { name: '+9 hours', value: '+0900' },
                        { name: '+10 hours', value: '+1000' },
                        { name: '+11 hours', value: '+1100' },
                        { name: '+12 hours', value: '+1200' }
                    ];
                    this.providerVersion = [
                        { name: '6.x', value: '6x' },
                        { name: '8.x', value: '8x' },
                    ];
                    this.current.jsonData = this.current.jsonData || {};
                    this.current.jsonData.sendHttpDelete = this.current.jsonData.sendHttpDelete || 1;
                    this.current.jsonData.keepCookies = ['JSESSIONID'];
                    this.current.jsonData.providerVersion = this.current.jsonData.providerVersion || '8x';
                    this.current.jsonData.tzOffset = this.current.jsonData.tzOffset || '+0000';
                }
                IPMConfigCtrl.templateUrl = 'partials/config.html';
                return IPMConfigCtrl;
            })();
            exports_1("IPMConfigCtrl", IPMConfigCtrl);
        }
    }
});
//# sourceMappingURL=config_ctrl.js.map