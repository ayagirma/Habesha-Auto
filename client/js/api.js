var api = (function () {
  "use strict";

  function getBaseUrl() {
    if (typeof window !== 'undefined' && window.location.port && window.location.port !== '3000') {
      return 'http://localhost:3000/api';
    }
    return '/api';
  }

  async function call(path, opts) {
    opts = opts || {};
    var res;
    var base = getBaseUrl();
    try {
      res = await fetch(base + path, {
        method: opts.method || 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: opts.body ? JSON.stringify(opts.body) : undefined,
      });
    } catch (e) {
      return { ok: false, status: 0, data: { error: 'Network error — is the server running at http://localhost:3000?' } };
    }
    var data = null;
    try { data = res.status === 204 ? null : await res.json(); } catch (e) { data = null; }
    return { ok: res.ok, status: res.status, data: data };
  }
  return {
    get: function (path) { return call(path); },
    post: function (path, body) { return call(path, { method: 'POST', body: body }); },
    put: function (path, body) { return call(path, { method: 'PUT', body: body }); },
    del: function (path) { return call(path, { method: 'DELETE' }); },
  };
})();
