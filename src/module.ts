import { IPMDatasource } from './datasource';
import { IPMQueryCtrl } from './query_ctrl';
import { IPMConfigCtrl } from './config_ctrl';


class IPMQueryOptionsCtrl {
  static templateUrl = 'partials/query.options.html';
}

export {
  IPMDatasource as Datasource,
  IPMQueryCtrl as QueryCtrl,
  IPMQueryOptionsCtrl as QueryOptionsCtrl,
  IPMConfigCtrl as ConfigCtrl
};
