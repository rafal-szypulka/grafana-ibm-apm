import _ from 'lodash';

export class IPMConfigCtrl {
    static templateUrl = 'partials/config.html';
    current: any;

    constructor($scope) {
        this.current.jsonData = this.current.jsonData || {};
    }

}