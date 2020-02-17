# IBM APM plugin for Grafana


> You may be also interested in [Prometheus exporter for ITM](https://github.com/rafal-szypulka/itm_exporter).


<details>
  <summary>CHANGELOG</summary>
- 0.9
  - Better support for table panels.
  - Redesigned query editor, added features like collecting multiple metrics per query and switching between timeserie and table format. 
  - Added configurable maximum number of queried datapoints.
- 0.8
  - Added support for string metrics, thx [@lcollin](https://github.com/lcollin)
  - Added example dashboard for Node.js application running in IBM Cloud Private.
  - Simplified installation for Grafana 5. Plugin works correctly without any modifications in Grafana 5 backend. See updated installation instructions and datasource configuration for details.
- 0.7
  - Fixed compatibility issue with Grafana 4.6
  - More readible dropdown lists in panel query editor. 
- 0.6
  -  Added datasource configuration option to deallocate dataset on ITM/APM server after every metric query. It is highly recommended to have it enabled all the time. Lack of datasource deallocation requests may cause memory leak and OutOfMemory exceptions on ITM/APM server. This plugin update requires also change in the Grafana server backend. See updated installation instructions and datasource configuration for details.
- 0.4
  -  Better error handling.
  -  Cosmetic changes in the panel query editor.
  -  UTC time zone offset option for ITMv6 HUB TEMS in the datasource configuration. Change the default settings only if HUB TEMS is located in non UTC time zone **and** you access Grafana dashboard from the timezone different than your HUB TEMS - in that case set UTC offset to HUB TEMS time zone.
- 0.3 
  - New field **Time Range** in the panel query editor. If set to **Current value**, then panel query will ignore global dashboard time filter and show only the current value of the metric. Use it only for singlestat and table panels. 

</details>


**Table of Contents** 



## Introduction

IBM APM plugin provides Grafana support for:

- IBM Tivoli Monitoring 6.x and IBM Omagamon
- IBM SmartCloud Application Performance Management 7.x 
- IBM Cloud Application Performance Management Private

The plugin uses metrics REST API to collect data directly from APMv8 and ITMv6.

![](./media/Sample_LinuxOS_dashboard_animated.gif)

## Configure the ITM/APM data source

The Screen below illustrates the completed configuration for the ITM v6 data source:

![](media/2020-02-17-17-38-55.png)

Specify the REST API URL:

-   APMv8

`http://<apm_server_hostname>:8090/ibm/tivoli/rest/providers/itm.KD8`

-   ITMv6/SCAPMv7

`http://<TEPS_server_hostname>:15200/ibm/tivoli/rest/providers/itm.<TEMS_NAME>`

**Note:** If you connect IBM APM datasource to Hub TEMS with HA configuration or `<TEMS_NAME>` contains non-alphanumeric characters, then define Domain Override in TEPS Data Provider. Check [issue #3](https://github.com/rafal-szypulka/grafana-ibm-apm/issues/3) for more details. 

![domain_override.png](./media/domain_override.png)

Select **Basic Auth** and specify the user name

- APMv8 – `smadmin`
- ITMv6/SCAPMv7 - `sysadmin` 

Select checkbox `Deallocate dataset after every metric query`. It is recommended to have it enabled all the time. Lack of datasource deallocation requests may cause memory leak and OutOfMemory exceptions on APM or ITM server. Disable this option only for testing a new panel query, if you want to use Grafana Query Inspector feature.


## Query Editor

The query editor for IBM APM Grafana plugin helps to assemble ITM/APM metrics API request.

Follow two simple examples below to learn how to use it.

#### 1. Line chart for Linux OS CPU

1.  Add new panel, select `Graph` as a visualization type, select `Queries` and your configured IBM APM data source.
![](media/2020-02-17-15-05-37.png)
2.  Select `Agent Type`. You can type agent code or agent type name to search for supported agent type or scroll down a dropdown list.
The list is built dynamically through the REST API call. If the resulting dropdown list is empty, a possible cause might be a connection problem with the APM REST API. You can easily debug it with developer tools in Chrome or Firebug in Firefox (see the Troubleshooting chapter at the end of this document).
![](media/2020-02-17-15-09-45.png)
3.  Similar way select other parameters like `Attribute Group`, `Group by` (only for Attribute groups with Primary Key/Display Item) and `Agent Instance`. Make sure that selected `Format` for Graph panel is `timeserie`.
4.  Click `+` to select one or more `Attributes` (metrics).
5.  Optionaly specify a `Condition` (for filtering results) and edit default `Aliases` for parameter name
customization. Alias, if defined, will replace the default parameter name in the legend. The default is *AttributeName:DisplayItem*. The alias replaces *AttributeName* part.
6.  The result should be similar to the one below:
![](media/2020-02-17-16-29-57.png)

#### 2. Table with Agents status
1.  Add new panel, select `Table` as a visualization type, select Queries and your configured IBM APM data source.
![](media/2020-02-17-17-25-05.png)
2.  Select parameters in the first row of Query Editor like `Agent Type`, `Attribute Group`. In our example we will show current agent status, so select `ANY:All Managed Systems` Agent Type, `Managed System Information` Attribute Group, and `TEMS` Agent Instance. Make sure that selected `Format` for Table panel is `table`.
3.  Select the following `Attributes` in the second row of Query Editor: HOSTNAME, NETADDR, PRODUCT, ORIGINNODE, AVAILABLE.
4.  The result should be similar to the one below:
![](media/2020-02-17-17-31-22.png)

## Grafana installation

Follow the steps described in the Grafana documentation:
[*http://docs.grafana.org/installation/*](http://docs.grafana.org/installation/) to install Grafana.

Latest versions of APMv8 and ITMv6 do a HTTP Referer header check and reject REST API calls when Referer URL (host and port part) is different than APM or TEPS URL. Use one of the following workarounds to modify Referer header of requests coming from Grafana to APMv8 or TEPS. 

- Disable the Referer HTTP header in the browser settings. Firefox: in the about:config page, search for Network.http.sendRefererHeader and set it to 0. Chrome requires a custom extension like [Referer Control](https://chrome.google.com/webstore/detail/referer-control/hnkcfpcejkafcihlgbojoidoihckciin).

- Install Nginx and access the Grafana URL through Nginx acting as a reverse proxy.
Nginx should be configured either to clear the Referer header or set it as APM/ITM URL with port http://xxx.xxx.xxx.xxx:xxx. In the nginx.conf modify location section and set it (if Nginx is installed locally on Grafana server) to:

```
        location / {
             proxy_pass http://localhost:3000/;
             proxy_set_header Referer "";
        } 
```

Full installation and configuration process (Grafana, Nginx and IBM APM plugin) is also recorded [here](https://developer.ibm.com/apm/videos/grafana-plugin-ibm-apm-installation-import-sample-dashboards/).


Example dashboards
==================

1). Sample IBM Stack monitoring dashboard with data from Linux OS, IBM HTTP Server, WebSphere Applications, WebSphere MQ, IBM DB2 and IBM Integration Bus agents:

    
![](./media/Sample_IBM_Stack_monitoring1.png)


2). Linux OS dashboard with the list of agents based on Grafana template variable. Data collected from APMv8.
![](./media/image3.png)

3). Linux OS dashboard with the list of agents based on Grafana template variable. Data collected from ITM 6.

[*http://169.44.6.110/dashboard/db/linux-os-dashboard-ibm-tivoli-monitoring-6-3-0-7?refresh=30s&orgId=1*](http://169.44.6.110/dashboard/db/linux-os-dashboard-ibm-tivoli-monitoring-6-3-0-7?refresh=30s&orgId=1)

It looks exatly the same as the one above, but data is collected from ITMv6.

4). Mashup of ITMv6 and APMv8 data on the same chart.

![](./media/mashup.png)

5). Repeated row example with contextual drill down to more detailed dashboard.

![](./media/repeated_panel.gif)

6). Sample IBM IIB monitoring dashboard.

![](./media/iib.png)

7). Transaction Volume and Response Time collected by the Web Response Time Agent.

![](./media/Transactions_collected_by_Response_Time_Agent.png)

8). Simulated Transaction Volume collected with the ITM Agent Builder custom agent created with the Agent Builder.

![](./media/Simulated_Transactions_Volumes_monitored_by_Custom_APM_Agent_-_1.png)


IBM APM plugin installation
===========================
Latest verion of the plugin is always available on this GitHub page. It can be also installed from the Grafana plugin repository. If you upgrade from older plugin version, manually remove plugin directory, for example `/var/lib/grafana/plugins/grafana-ibm-apm` and follow the installation steps below.

1).  Install the plugin using one of the following methods:

a.) Download the latest release of the IBM APM plugin from [here](https://github.com/rafal-szypulka/grafana-ibm-apm/releases) and unpack on your Grafana server in `/var/lib/grafana/plugins` directory.

b.) Simply clone the GitHub repository on your Grafana server: 

```
cd /var/lib/grafana/plugins/
git clone https://github.com/rafal-szypulka/grafana-ibm-apm

```
c.) Install the plugin using the Grafana CLI:

```
grafana-cli plugins install ibm-apm-datasource
```

2). Restart Grafana. On RedHat/Centos run:

`systemctl restart grafana-server`

IBM APM data source configuration
=================================

Click the Grafana Logo -&gt; Data Sources and click **+Add data source**.

![g1.png](./media/image16.png)

Specify the data source name and select “IBM APM” from the list.

![g2.png](./media/ds1.png)

Specify the REST API URL:

-   APMv8

`http://<apm_server_hostname>:8090/ibm/tivoli/rest/providers/itm.KD8`

-   ITMv6/SCAPMv7

`http://<TEPS_server_hostname>:15200/ibm/tivoli/rest/providers/itm.<TEMS_NAME>`

**Note:** If you connect IBM APM datasource to Hub TEMS with HA configuration or `<TEMS_NAME>` contains non-alphanumeric characters, then define Domain Override in TEPS Data Provider. Check [issue #3](https://github.com/rafal-szypulka/grafana-ibm-apm/issues/3) for more details. 

![domain_override.png](./media/domain_override.png)

Select **Basic Auth** and **With credentials** and specify the user name

-   APMv8 – smadmin (default password apmpass)
-   ITMv6/SCAPMv7 sysadmin (password for ITM sysadmin user)

Select checkbox "Deallocate dataset after every metric query". It is recommended to have it enabled all the time. Lack of datasource deallocation requests may cause memory leak and OutOfMemory exceptions on APM or ITM server. Disable this option only for testing a new panel query, if you want to use Grafana Query Inspector feature.

The Screen below illustrates the completed configuration for the APMv8 data source:

![g3.png](./media/ds2.png){

Click **Save & Test**. If the connection is successful, you should see the following
message:

![g4.png](./media/ds3.png)

Configuration for ITMv6/SCAPMv7:

![g5.png](./media/ds4.png)

Click Cancel to exit. Now both data sources are configured.

![g7.png](./media/ds5.png)

Templating
==========

The IBM APM plugin for Grafana supports the basic templating feature. Check the example dashboard:

[*http://169.44.6.110/dashboard/db/linux-os-dashboard-ibm-performance-management-8-1-3?refresh=30s&orgId=1*](http://169.44.6.110/dashboard/db/linux-os-dashboard-ibm-performance-management-8-1-3?refresh=30s&orgId=1)

![](./media/image22.png)

The agent instances list (dynamic and searchable) in the upper left corner
was created using Grafana template variable. When you select another
agent instance, all the panels are updated with data from another agent
instance.

**How to set it up step by step:**

1.  Create the template variable. Click
    ![](./media/image1.png) **Manage dashboards** > **Templating**, then click the **+New**

2.  Specify the template settings as shown in the picture below:

Variable name **AgentName** will be used in a panel query as **$AgentName** and will
be substituted during query execution by the current option selected
from the upper-left corner list. Select your APM Data Source and specify
agent type in the Query.

![](./media/image23.png)

Agent Type in the Query field should be specified in an obscure form of the
APM REST API datasource id (it may be improved in a future
version of the plugin). For example, for Linux OS Agent it is **TMSAgent.%IBM.STATIC134**.

Datasource IDs can be listed using APM REST API test tool via HTTP GET
request of the following URL:

/ibm/tivoli/rest/providers/itm.KD8/datasources for APMv8 or
/ibm/tivoli/rest/providers/itm.&lt;TEMS\_name&gt;/datasources for
ITMv6/SCAPMv7.

![](./media/image24.png)

Troubleshooting
===============

1). IBM APM plugin for Grafana does not currently support Grafana Alerting feature.

2). If you configured your new panel and do not see the data, use the 
Chrome developer tools or Firefox Firebug and check the console – you should
see an error message there. For example, if there is a syntax error in the **condition** field, the REST API will return status code 500 and the error message will be logged in the javascript console.


3). The ITM REST API does not provide data
for **every** attribute. The plugin tries to filter out Attribute Groups not
available in the APM prefetch database, but even if the specific attribute group
is collected in prefetch, it could be that specific attribute is not
provided by the REST API. Use the Chrome developer tools (network tab) or
Firefox Firebug to see what requests are made to the REST API, copy it
and test in the APM REST API test tool:

APMv8: http://\<apm\_server\_hostname\>:8090/ITMRESTProvider/test.html

ITM6/SACAPM7: http://\<TEPS\_server\_hostname\>:15200/ITMRESTPrivider/test.html


Example request:

![](./media/image25.png)

Example response:

![](./media/image26.png)

The same request in the APM REST API test tool:

![](./media/image27.png)

Note the difference in the request URL done from your browser to Grafana:

**169.44.6.110/api/datasources/proxy/2**/datasources/TMSAgent.%25IBM.STATIC134/datasets/MetricGroup.KLZCPU/items?clearCache=true&condition=CPUID+%3D+-1&optimize=true&param\_NoCache=false&param\_SourceToken=skarsv100:LZ&param\_Time=20170428T072122--20170428T082122&properties=BUSYCPU,WRITETIME,CPUID

Grafana proxies API requests, so the actual APM REST API call is done not from
your browser client, but from the Grafana server to the APM server.

To test the same request in the APM REST API test tool change it to:

**/ibm/tivoli/rest/providers/itm.KD8**/datasources/TMSAgent.%25IBM.STATIC134/datasets/MetricGroup.KLZCPU/items?clearCache=true&condition=CPUID+%3D+-1&optimize=true&param\_NoCache=false&param\_SourceToken=skarsv100:LZ&param\_Time=20170428T072122--20170428T082122&properties=BUSYCPU,WRITETIME,CPUID

4). If the REST API rejects requests from Grafana because of wrong HTTP referer header, use one of the proposed workarounds described in the installation chapter.

5). [ITMv6] If the historical collection is not enabled for attribute group specified in the panel query then, by default the similar error will be logged in the bowser console:

```
{"message":"IPM Error: undefined","data" {"msgId":"ATKRST100E","stackTrace":
"com.ibm.usmi.console.navigator.model.NavException: 
(ATKRST100E) ATKRST100E An unexpected error occured. 
The error message is as follows: 'KFWITM217E Request error: SQL1_OpenRequest failed 
rc=3000\n'.: nested exception is: 
\n\tcom.ibm.tivoli.monitoring.provider.navmodel.ITMRuntimeException:
 KFWITM217E Request error: SQL1_OpenRequest failed rc=3000\n\r\n\tat
 (...)
```
Enable historical collection for the following Attribute Groups, 
if you are going to import [sample dashboard for ITMv6 Linux OS Agents](https://github.com/rafal-szypulka/grafana-ibm-apm/blob/master/Example_dashboards/Linux%20OS%20Dashboard%20-%20IBM%20Tivoli%20Monitoring%206.3.0.7-1493380888346.json):

- KLZ CPU
- KLZ Disk
- KLZ Disk IO
- KLZ Network
- KLZ System Statistics
- KLZ VM Stats

Attributes from attribute groups not enabled for historical collection can be displayed in singlestat and table panels if the option **Time Range** is set to *Current value* in the panel query editor.