import React from 'react';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { InlineFormLabel, Input, SecretInput } from '@grafana/ui';
import type { MarkLogicDataSourceOptions, MarkLogicSecureJsonData } from './types';

export function ConfigEditor(props: DataSourcePluginOptionsEditorProps<MarkLogicDataSourceOptions, MarkLogicSecureJsonData>) {
  const { options, onOptionsChange } = props;
  const { jsonData, secureJsonData, secureJsonFields } = options;

  return (
    <div className="gf-form-group">
      <h3 className="page-heading">Connection</h3>
      <div className="gf-form">
        <InlineFormLabel width={12}>URL</InlineFormLabel>
        <Input
          width={24}
          type="text"
          value={jsonData.url || ''}
          placeholder="http://localhost:8002"
          onChange={(e) =>
            onOptionsChange({
              ...options,
              jsonData: { ...jsonData, url: e.currentTarget.value || undefined },
            })
          }
        />
      </div>
      <div className="gf-form">
        <InlineFormLabel width={12}>Default Server ID</InlineFormLabel>
        <Input
          width={24}
          type="text"
          value={jsonData.serverId || 'Admin'}
          placeholder="Admin"
          onChange={(e) =>
            onOptionsChange({
              ...options,
              jsonData: { ...jsonData, serverId: e.currentTarget.value || undefined },
            })
          }
        />
      </div>
      <div className="gf-form">
        <InlineFormLabel width={12}>TLS Skip Verify</InlineFormLabel>
        <input
          type="checkbox"
          checked={jsonData.tlsSkipVerify ?? false}
          onChange={(e) =>
            onOptionsChange({
              ...options,
              jsonData: { ...jsonData, tlsSkipVerify: e.target.checked },
            })
          }
        />
      </div>

      <h3 className="page-heading">Authentication</h3>
      <div className="gf-form">
        <InlineFormLabel width={12}>Username</InlineFormLabel>
        <Input
          width={24}
          type="text"
          value={secureJsonData?.username || ''}
          placeholder="admin"
          onChange={(e) =>
            onOptionsChange({
              ...options,
              secureJsonData: { ...secureJsonData, username: e.currentTarget.value || undefined },
            })
          }
        />
      </div>
      <div className="gf-form">
        <InlineFormLabel width={12}>Password</InlineFormLabel>
        <SecretInput
          width={24}
          placeholder="Password"
          isConfigured={!!secureJsonFields?.password}
          onReset={() =>
            onOptionsChange({
              ...options,
              secureJsonFields: { ...secureJsonFields, password: false },
              secureJsonData: { ...secureJsonData, password: undefined },
            })
          }
          onChange={(e) =>
            onOptionsChange({
              ...options,
              secureJsonData: { ...secureJsonData, password: e.currentTarget.value || undefined },
              secureJsonFields: { ...secureJsonFields, password: !!e.currentTarget.value },
            })
          }
        />
      </div>
    </div>
  );
}
