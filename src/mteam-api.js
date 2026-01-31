const DEFAULT_BASE_URL = 'https://api.m-team.cc';

export class MTeamApiError extends Error {
  constructor(message, { code, status } = {}) {
    super(message);
    this.name = 'MTeamApiError';
    this.code = code;
    this.status = status;
  }
}

export class MTeamClient {
  constructor({ apiKey, baseUrl = DEFAULT_BASE_URL, timeoutMs = 20000 } = {}) {
    this.apiKey = (apiKey ?? '').trim();
    this.baseUrl = (baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '');
    this.timeoutMs = Number(timeoutMs) || 20000;
  }

  validateApiKeyShape() {
    const key = (this.apiKey ?? '').trim();
    if (!key) throw new MTeamApiError('API key is empty. Set MTEAM_API_KEY.', { code: 'invalidAPIKey' });
    if (key.length < 32) throw new MTeamApiError('API key looks too short (<32).', { code: 'invalidAPIKey' });
  }

  async #fetchJson(path, { method = 'POST', headers = {}, body } = {}) {
    this.validateApiKeyShape();

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          'x-api-key': this.apiKey,
          ...headers,
        },
        body,
        signal: controller.signal,
      });

      if (res.status === 401) {
        throw new MTeamApiError('API key invalid or expired (HTTP 401).', { code: 'invalidAPIKey', status: 401 });
      }

      const text = await res.text();
      let json;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        throw new MTeamApiError('Failed to decode JSON response.', { code: 'decodingError', status: res.status });
      }

      if (!res.ok) {
        throw new MTeamApiError(`HTTP error ${res.status}`, { code: 'networkError', status: res.status });
      }

      if (json && json.code && json.code !== '0') {
        throw new MTeamApiError(json.message || 'API error', { code: 'apiError', status: res.status });
      }

      return json;
    } catch (e) {
      if (e?.name === 'AbortError') {
        throw new MTeamApiError(`Request timed out after ${this.timeoutMs}ms`, { code: 'networkError' });
      }
      if (e instanceof MTeamApiError) throw e;
      throw new MTeamApiError(e?.message || 'Unknown error', { code: 'unknown' });
    } finally {
      clearTimeout(t);
    }
  }

  async searchTorrents({
    mode = 'normal',
    visible = 1,
    keyword = '',
    categories = [],
    pageNumber = 1,
    pageSize = 20,
  } = {}) {
    const body = JSON.stringify({
      mode,
      visible,
      keyword,
      categories,
      pageNumber,
      pageSize,
    });

    const json = await this.#fetchJson('/api/torrent/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    const data = json?.data ?? {};
    const torrents = Array.isArray(data.data) ? data.data : [];
    return {
      pageNumber: Number(data.pageNumber || pageNumber),
      pageSize: Number(data.pageSize || pageSize),
      total: Number(data.total || 0),
      totalPages: Number(data.totalPages || 0),
      torrents,
    };
  }

  async genDlToken(torrentId) {
    const form = new URLSearchParams({ id: String(torrentId) });
    const json = await this.#fetchJson('/api/torrent/genDlToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
    });
    return json?.data;
  }

  async validateApiKey() {
    try {
      await this.searchTorrents({ keyword: 'test', pageNumber: 1, pageSize: 1 });
      return { isValid: true, errorMessage: null };
    } catch (e) {
      return { isValid: false, errorMessage: e?.message || String(e) };
    }
  }
}
