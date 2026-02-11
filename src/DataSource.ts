import {
  DataSourceInstanceSettings,
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  MetricFindValue,
  toDataFrame,
} from '@grafana/data';
import { getTemplateSrv } from '@grafana/runtime';
import type { MarkLogicDataSourceOptions, MarkLogicQuery } from './types';
import { buildMetersUrl, fetchWithDigestAuth, MetersResponse } from './api';

export class DataSource extends DataSourceApi<MarkLogicQuery, MarkLogicDataSourceOptions> {
  private url: string;
  private serverId: string;
  private tlsSkipVerify: boolean;
  private instanceSettings: DataSourceInstanceSettings<MarkLogicDataSourceOptions>;

  constructor(instanceSettings: DataSourceInstanceSettings<MarkLogicDataSourceOptions>) {
    super(instanceSettings);
    this.instanceSettings = instanceSettings;
    const baseUrl = instanceSettings.url || instanceSettings.jsonData?.url || '';
    this.url = baseUrl.replace(/\/$/, '') || '';
    this.serverId = instanceSettings.jsonData.serverId || 'Admin';
    this.tlsSkipVerify = instanceSettings.jsonData.tlsSkipVerify ?? false;
  }

  getUrl(): string {
    return this.url;
  }

  getServerId(): string {
    return this.serverId;
  }

  async query(request: DataQueryRequest<MarkLogicQuery>): Promise<DataQueryResponse> {
    const { range } = request;
    const data = [];

    for (const target of request.targets) {
      if (!target.queryType || target.queryType === 'meters') {
        const serverId = getTemplateSrv().replace(target.serverId || this.serverId) || this.serverId;
        const meterPattern = getTemplateSrv().replace(target.meterPattern || '') || undefined;
        const frames = await this.queryMeters(serverId, meterPattern, range?.from.valueOf(), range?.to.valueOf());
        data.push(...frames);
      }
    }

    return { data };
  }

  async testDatasource(): Promise<{ status: string; message: string }> {
    const baseUrl = this.url || 'http://localhost:8002';
    const healthUrl = `${baseUrl}/manage/v2`;

    try {
      const res = await fetchWithDigestAuth(
        healthUrl,
        this.getUsername(),
        this.getPassword(),
        this.tlsSkipVerify
      );

      if (!res.ok) {
        return {
          status: 'error',
          message: `Management API returned ${res.status}: ${res.statusText}`,
        };
      }

      return {
        status: 'success',
        message: 'Successfully connected to MarkLogic Management API',
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        status: 'error',
        message: `Connection failed: ${msg}`,
      };
    }
  }

  async metricFindQuery(query: string): Promise<MetricFindValue[]> {
    // Future: support variable queries (e.g., list servers, meter names)
    return [];
  }

  private async queryMeters(
    serverId: string,
    meterPattern: string | undefined,
    fromMs?: number,
    toMs?: number
  ) {
    const url = buildMetersUrl(this.url, serverId);
    const res = await fetchWithDigestAuth(
      url,
      this.getUsername(),
      this.getPassword(),
      this.tlsSkipVerify
    );

    if (!res.ok) {
      throw new Error(`Meters API returned ${res.status}: ${res.statusText}`);
    }

    const data: MetersResponse = await res.json();
    return transformMetersToDataFrames(data, meterPattern, toMs ?? Date.now());
  }

  private getUsername(): string {
    const s = this.instanceSettings as DataSourceInstanceSettings<MarkLogicDataSourceOptions> & {
      decryptedSecureJsonData?: Record<string, string>;
    };
    return s?.decryptedSecureJsonData?.username || '';
  }

  private getPassword(): string {
    const s = this.instanceSettings as DataSourceInstanceSettings<MarkLogicDataSourceOptions> & {
      decryptedSecureJsonData?: Record<string, string>;
    };
    return s?.decryptedSecureJsonData?.password || '';
  }
}

function transformMetersToDataFrames(
  data: MetersResponse,
  meterPattern: string | undefined,
  timestampMs: number
) {
  // Meters API response structure varies; adapt based on actual API docs
  // Common patterns: { "meter-name": value } or { "metrics": [...] }
  const meters = extractMeters(data, meterPattern);

  if (meters.length === 0) {
    return [];
  }

  const time = new Date(timestampMs);

  // Single frame with all meters as fields (for Table/Stat)
  const fields = meters.map((m) => ({
    name: m.name,
    type: 'number' as const,
    values: [m.value],
  }));

  return [
    toDataFrame({
      name: 'meters',
      fields: [
        { name: 'Time', type: 'time', values: [time] },
        ...fields,
      ],
    }),
  ];
}

function extractMeters(
  data: MetersResponse,
  pattern?: string
): Array<{ name: string; value: number }> {
  const result: Array<{ name: string; value: number }> = [];
  const regex = pattern ? new RegExp(pattern.replace(/\*/g, '.*'), 'i') : null;

  function walk(obj: unknown, prefix = ''): void {
    if (obj === null || obj === undefined) return;

    if (typeof obj === 'number') {
      const name = prefix || 'value';
      if (!regex || regex.test(name)) {
        result.push({ name, value: obj });
      }
      return;
    }

    if (Array.isArray(obj)) {
      obj.forEach((v, i) => walk(v, `${prefix}[${i}]`));
      return;
    }

    if (typeof obj === 'object') {
      for (const [k, v] of Object.entries(obj)) {
        const next = prefix ? `${prefix}.${k}` : k;
        walk(v, next);
      }
    }
  }

  walk(data);
  return result;
}
