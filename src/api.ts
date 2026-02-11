/**
 * MarkLogic Management API client.
 * Meters API: https://docs.marklogic.com/REST/management/meters
 */

import DigestFetch from 'digest-fetch';

export interface MetersResponse {
  [key: string]: unknown;
}

export function buildMetersUrl(baseUrl: string, serverId: string): string {
  const url = (baseUrl || 'http://localhost:8002').replace(/\/$/, '');
  const encoded = encodeURIComponent(serverId);
  return `${url}/manage/v2/servers/${encoded}/metrics/meters`;
}

export async function fetchWithDigestAuth(
  url: string,
  username: string,
  password: string,
  _tlsSkipVerify: boolean
): Promise<Response> {
  const client = new DigestFetch(username, password);
  const res = await client.fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  // Basic auth fallback if no digest challenge (e.g., some test setups)
  if (res.status === 401 && username && password) {
    const basic = btoa(`${username}:${password}`);
    return fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Basic ${basic}`,
      },
    });
  }

  return res;
}
