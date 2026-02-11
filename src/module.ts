import { DataSourcePlugin } from '@grafana/data';
import { ConfigEditor } from './ConfigEditor';
import { DataSource } from './DataSource';
import { QueryEditor } from './QueryEditor';
import type { MarkLogicDataSourceOptions, MarkLogicQuery } from './types';

export const plugin = new DataSourcePlugin<DataSource, MarkLogicQuery, MarkLogicDataSourceOptions>(DataSource)
  .setConfigEditor(ConfigEditor)
  .setQueryEditor(QueryEditor);
