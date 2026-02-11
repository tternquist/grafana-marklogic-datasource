import React from 'react';
import {
  DataSourcePluginOptionsEditorProps,
  updateDatasourcePluginOption,
  updateDatasourcePluginJsonDataOption,
  updateDatasourcePluginSecureJsonDataOption,
  updateDatasourcePluginResetOption,
} from '@grafana/data';
import { InlineFormLabel, Input, SecretInput } from '@grafana/ui';
import type { MarkLogicDataSourceOptions, MarkLogicSecureJsonData } from './types';

export function ConfigEditor(props: DataSourcePluginOptionsEditorProps<MarkLogicDataSourceOptions, MarkLogicSecureJsonData>) {
  const { options, onOptionsChange } = props;
  const jsonData = options.jsonData ?? {};
  const secureJsonData = options.secureJsonData ?? {};
  const secureJsonFields = options.secureJsonFields ?? {};
  const url = options.url ?? jsonData.url ?? '';

  return (
    <div className="gf-form-group">
      <h3 className="page-heading">Connection</h3>
      <div className="gf-form">
        <InlineFormLabel width={12}>URL</InlineFormLabel>
        <Input
          width={24}
          type="text"
          value={url}
          placeholder="http://localhost:8002"
          onChange={(e) => updateDatasourcePluginOption(props, 'url', e.currentTarget.value)}
        />
      </div>
      <div className="gf-form">
        <InlineFormLabel width={12}>Default Server ID</InlineFormLabel>
        <Input
          width={24}
          type="text"
          value={jsonData.serverId ?? 'Admin'}
          placeholder="Admin"
          onChange={(e) => updateDatasourcePluginJsonDataOption(props, 'serverId', e.currentTarget.value)}
        />
      </div>
      <div className="gf-form">
        <InlineFormLabel width={12}>TLS Skip Verify</InlineFormLabel>
        <input
          type="checkbox"
          checked={jsonData.tlsSkipVerify ?? false}
          onChange={(e) => updateDatasourcePluginJsonDataOption(props, 'tlsSkipVerify', e.target.checked)}
        />
      </div>

      <h3 className="page-heading">Authentication</h3>
      <div className="gf-form">
        <InlineFormLabel width={12}>Username</InlineFormLabel>
        <Input
          width={24}
          type="text"
          value={secureJsonData.username ?? ''}
          placeholder="admin"
          onChange={(e) => updateDatasourcePluginSecureJsonDataOption(props, 'username', e.currentTarget.value)}
        />
      </div>
      <div className="gf-form">
        <InlineFormLabel width={12}>Password</InlineFormLabel>
        <SecretInput
          width={24}
          placeholder="Password"
          isConfigured={!!secureJsonFields.password}
          onReset={() => updateDatasourcePluginResetOption(props, 'password')}
          onChange={(e) => {
            const value = e.currentTarget.value;
            props.onOptionsChange({
              ...props.options,
              secureJsonData: { ...secureJsonData, password: value || undefined },
              secureJsonFields: { ...secureJsonFields, password: !!value },
            });
          }}
        />
      </div>
    </div>
  );
}
