/// <reference path="../typings/tsd.d.ts" />
import { QueryCtrl } from 'app/plugins/sdk';
declare class IPMQueryCtrl extends QueryCtrl {
    static templateUrl: string;
    refresh: any;
    metric_types: any;
    datasource: any;
    type: any;
    at: any[];
    ag: any[];
    atr: any[];
    pk: any[];
    ai: any[];
    showPrimaryKey: boolean;
    timeAttributes: {
        name: string;
        value: string;
    }[];
    valueAttributes: {
        name: string;
        value: string;
    }[];
    timeRangeAttributes: {
        name: string;
        value: string;
    }[];
    /** @ngInject **/
    constructor($scope: any, $injector: any);
    getAgentTypes(): any;
    AgentTypes(): any;
    getAttributeGroups(): any;
    AttributeGroups(): any;
    getAgentInstances(): any;
    AgentInstances(): any;
    getAttributes(): any;
    Attributes(): any;
    getPrimaryKey(): any;
    PrimaryKey(): any;
    onChangeAgentType(): void;
    onChangeInternal(): void;
    onChangeAttributeGroup(): void;
}
export { IPMQueryCtrl };
