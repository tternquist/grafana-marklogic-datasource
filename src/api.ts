/**
 * MarkLogic Management API client.
 * Meters API: https://docs.marklogic.com/REST/management/meters
 * Uses native fetch with manual Digest auth (browser-compatible, no node-fetch).
 */

import md5 from 'md5';

export interface MetersResponse {
  [key: string]: unknown;
}

export function buildMetersUrl(baseUrl: string, serverId: string): string {
  const url = (baseUrl || 'http://localhost:8002').replace(/\/$/, '');
  const encoded = encodeURIComponent(serverId);
  return `${url}/manage/v2/servers/${encoded}/metrics/meters`;
}

function parseDigestChallenge(wwwAuth: string): { realm: string; nonce: string; qop: string; opaque?: string } | null {
  const params: Record<string, string> = {};
  const parts = wwwAuth.replace(/^Digest\s+/i, '').split(/,\s*/);
  for (const p of parts) {
    const m = p.match(/^(\w+)=(?:"([^"]*)"|([^\s,]*))$/);
    if (m) params[m[1]] = (m[2] || m[3] || '').replace(/^"|"$/g, '');
  }
  if (!params.nonce || !params.realm) return null;
  return {
    realm: params.realm,
    nonce: params.nonce,
    qop: params.qop || 'auth',
    opaque: params.opaque,
  };
}

export async function fetchWithDigestAuth(
  urlStr: string,
  username: string,
  password: string,
  _tlsSkipVerify: boolean
): Promise<Response> {
  const parsed = new URL(urlStr);
  const uri = parsed.pathname + parsed.search;
  const options: RequestInit = {
    method: 'GET',
    headers: { Accept: 'application/json' },
  };

  let res = await fetch(urlStr, options);

  if (res.status === 401) {
    const wwwAuth = res.headers.get('WWW-Authenticate');
    if (wwwAuth?.toLowerCase().startsWith('digest') && username && password) {
      const auth = parseDigestChallenge(wwwAuth);
      if (auth) {
        const nc = '00000001';
        const cnonce = Math.random().toString(36).slice(2, 14);
        const ha1 = md5(`${username}:${auth.realm}:${password}`);
        const ha2 = md5(`GET:${uri}`);
        const response = md5(`${ha1}:${auth.nonce}:${nc}:${cnonce}:${auth.qop}:${ha2}`);
        const authHeader = `Digest username="${username}",realm="${auth.realm}",nonce="${auth.nonce}",uri="${uri}",response="${response}",qop=${auth.qop},nc=${nc},cnonce="${cnonce}"`;
        res = await fetch(urlStr, {
          ...options,
          headers: { ...options.headers, Authorization: authHeader } as HeadersInit,
        });
      }
    }
  }

  if (res.status === 401 && username && password) {
    const basic = btoa(`${username}:${password}`);
    res = await fetch(urlStr, {
      ...options,
      headers: { ...options.headers, Authorization: `Basic ${basic}` } as HeadersInit,
    });
  }

  return res;
}
