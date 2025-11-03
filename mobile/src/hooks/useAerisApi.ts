import { useCallback } from 'react';
import { API_BASE_URL, DEFAULT_TENANT } from '../config';

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT';

type RequestOptions = {
  method?: Method;
  path: string;
  body?: Record<string, unknown>;
  tenantId?: string;
};

export function useAerisApi() {
  return useCallback(async ({ method = 'GET', path, body, tenantId }: RequestOptions) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': tenantId || DEFAULT_TENANT,
      },
      body: method === 'GET' ? undefined : JSON.stringify(body || {}),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || response.statusText);
    }
    return payload;
  }, []);
}
