import { DataQuery, DataSourceJsonData } from '@grafana/data';

export interface MarkLogicQuery extends DataQuery {
  queryType?: 'meters';
  serverId?: string;
  meterPattern?: string;
}

export interface MarkLogicDataSourceOptions extends DataSourceJsonData {
  url?: string;
  serverId?: string;
  tlsSkipVerify?: boolean;
}

export interface MarkLogicSecureJsonData {
  username?: string;
  password?: string;
}
