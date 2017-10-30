/// <reference path="../typings/tsd.d.ts" />
declare class IPMDatasource {
    private $q;
    private backendSrv;
    private templateSrv;
    name: string;
    url: string;
    appId: any;
    pk: any;
    alertSrv: any;
    tzOffset: string;
    sendHttpDelete: boolean;
    providerVersion: string;
    constructor(instanceSettings: any, $q: any, backendSrv: any, templateSrv: any, alertSrv: any);
    query(options: any): any;
    getAgentTypes(): any;
    getAttributeGroups(agentType: any): any;
    getAgentInstances(agentType: any): any;
    metricFindQuery(agentType: any): any;
    getAttributes(agentType: any, attributeGroup: any): any;
    getPrimaryKey(agentType: any, attributeGroup: any): any;
    testDatasource(): any;
    parse(results: any): any[];
    getDatapoints(items: any, target: any): any[];
    getTarget(items: any, value: any): any;
    httpGet(request: any): any;
    doSimpleHttpGet(request: any): any;
}
export { IPMDatasource };
