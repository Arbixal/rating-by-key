import { afterEach, describe, expect, test, vi } from 'vitest';
import { fetchJson } from './api';

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('fetchJson', () => {
  test('throws an ApiError with the server message for a failed response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({message: 'Too many requests'}),
    }));

    await expect(fetchJson('/api/example')).rejects.toEqual(
      expect.objectContaining({
        name: 'ApiError',
        message: 'Too many requests',
        status: 429,
      }),
    );
  });

  test('reports invalid JSON from a successful response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('Unexpected token');
      },
    }));

    await expect(fetchJson('/api/example')).rejects.toEqual(
      expect.objectContaining({
        name: 'ApiError',
        message: 'The API returned an invalid response.',
        status: 200,
      }),
    );
  });

  test('rejects a successful response that fails its runtime validator', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({unexpected: true}),
    }));

    await expect(fetchJson<{ready: true}>('/api/example', {
      validate: (value: unknown): value is {ready: true} => {
        return typeof value === 'object' && value !== null && 'ready' in value && value.ready === true;
      },
    })).rejects.toEqual(
      expect.objectContaining({
        name: 'ApiError',
        message: 'The API returned data in an unexpected format.',
        status: 200,
      }),
    );
  });

  test('aborts and reports a request timeout', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn((_input: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), {once: true});
    })));

    const request = fetchJson('/api/example', {timeoutMs: 50});
    const rejection = expect(request).rejects.toEqual(
      expect.objectContaining({
        name: 'ApiError',
        message: 'The API request timed out. Please try again.',
        status: 408,
      }),
    );
    await vi.advanceTimersByTimeAsync(50);

    await rejection;
  });
});
