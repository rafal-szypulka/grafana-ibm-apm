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
    showPrimaryKey: boolean;
    attrSegments: any[];
    uiSegmentSrv: any;
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
    formats: {
        name: string;
        value: string;
    }[];
    /** @ngInject **/
    constructor($scope: any, $injector: any, uiSegmentSrv: any, $q: any);
    setAttrSegments(): void;
    attrSegmentUpdated(col: any, index: any): void;
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
    onChangeInternal(): void;
    onChangeTimeRange(): void;
    onChangeAttributeGroup(): void;
}
export { IPMQueryCtrl };
