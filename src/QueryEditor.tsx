import React from 'react';
import { QueryEditorProps } from '@grafana/data';
import { InlineFormLabel, Input } from '@grafana/ui';
import type { DataSource } from './DataSource';
import type { MarkLogicDataSourceOptions, MarkLogicQuery } from './types';

type Props = QueryEditorProps<DataSource, MarkLogicQuery, MarkLogicDataSourceOptions>;

export function QueryEditor({ query, onChange, datasource }: Props) {
  const serverId = query.serverId ?? datasource.getServerId();
  const meterPattern = query.meterPattern ?? '';

  return (
    <div className="gf-form">
      <InlineFormLabel width={10}>Server ID</InlineFormLabel>
      <Input
        width={20}
        value={serverId}
        placeholder={datasource.getServerId()}
        onChange={(e) => onChange({ ...query, serverId: e.currentTarget.value })}
      />
      <InlineFormLabel width={10}>Meter pattern</InlineFormLabel>
      <Input
        width={30}
        value={meterPattern}
        placeholder="* (all) or e.g. *cache*, requests"
        onChange={(e) => onChange({ ...query, meterPattern: e.currentTarget.value })}
      />
    </div>
  );
}
