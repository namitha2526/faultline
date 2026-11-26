/**
 * Faultline JS SDK - Semantic Error Intelligence Client
 * Captures window.onerror and unhandledrejection, posting them to Faultline API.
 */
(function (global) {
  'use strict';

  var Faultline = {
    config: {
      apiKey: null,
      endpoint: 'http://localhost:8000',
      release: '1.0.0',
      environment: 'production',
      userId: null,
      debug: false,
      maxBreadcrumbs: 20,
    },
    initialized: false,
    _recentSignatures: {},

    init: function (options) {
      if (!options || !options.apiKey) {
        console.error('[Faultline] Initialization failed: apiKey is required.');
        return;
      }
      this.config = Object.assign({}, this.config, options);
      // Ensure endpoint doesn't have trailing slash
      this.config.endpoint = this.config.endpoint.replace(/\/+$/, '');

      if (this.initialized) {
        if (this.config.debug) console.warn('[Faultline] Already initialized.');
        return;
      }

      this._setupGlobalHandlers();
      this.initialized = true;

      if (this.config.debug) {
        console.log('[Faultline] Initialized with endpoint:', this.config.endpoint);
      }
    },

    setUser: function (userId) {
      this.config.userId = userId;
    },

    captureException: function (error, extra) {
      if (!this.initialized) {
        console.warn('[Faultline] captureException called before init().');
      }

      var payload = this._formatErrorPayload(error, extra);
      return this._send(payload);
    },

    captureMessage: function (message, extra) {
      var payload = {
        message: String(message),
        stack_trace: (new Error()).stack || null,
        exception_type: 'CapturedMessage',
        browser: this._detectBrowser(),
        os: this._detectOS(),
        url: typeof window !== 'undefined' ? window.location.href : null,
        user_id: this.config.userId,
        release: this.config.release,
        timestamp: new Date().toISOString(),
      };
      if (extra && extra.userId) payload.user_id = extra.userId;
      return this._send(payload);
    },

    _setupGlobalHandlers: function () {
      if (typeof window === 'undefined') return;

      var self = this;

      // 1. Capture uncaught runtime exceptions
      window.addEventListener('error', function (event) {
        // If event.error is an actual Error object, use it; otherwise construct one from message/filename/lineno
        var error = event.error || {
          message: event.message,
          name: 'Error',
          stack: (event.filename ? ('at ' + event.filename + ':' + event.lineno + ':' + event.colno) : null),
        };

        var extra = {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        };

        self.captureException(error, extra);
      });

      // 2. Capture unhandled Promise rejections
      window.addEventListener('unhandledrejection', function (event) {
        var reason = event.reason;
        var error;

        if (reason instanceof Error) {
          error = reason;
        } else if (typeof reason === 'string') {
          error = new Error(reason);
          error.name = 'UnhandledPromiseRejection';
        } else {
          try {
            error = new Error(JSON.stringify(reason));
          } catch (e) {
            error = new Error('Unhandled Promise Rejection with non-serializable value');
          }
          error.name = 'UnhandledPromiseRejection';
        }

        self.captureException(error, { unhandledPromise: true });
      });
    },

    _formatErrorPayload: function (error, extra) {
      var message = 'Unknown error';
      var exceptionType = 'Error';
      var stackTrace = null;

      if (error) {
        if (typeof error === 'string') {
          message = error;
        } else {
          message = error.message || String(error);
          exceptionType = error.name || error.constructor.name || 'Error';
          stackTrace = error.stack || null;
        }
      }

      var payload = {
        message: message,
        stack_trace: stackTrace,
        exception_type: exceptionType,
        browser: this._detectBrowser(),
        os: this._detectOS(),
        url: typeof window !== 'undefined' ? window.location.href : null,
        user_id: (extra && extra.userId) || this.config.userId,
        release: this.config.release,
        timestamp: new Date().toISOString(),
      };

      return payload;
    },

    _detectBrowser: function () {
      if (typeof navigator === 'undefined') return 'NodeJS/Server';
      var ua = navigator.userAgent;
      if (/Edg\//.test(ua)) return 'Edge';
      if (/Chrome\//.test(ua)) return 'Chrome';
      if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return 'Safari';
      if (/Firefox\//.test(ua)) return 'Firefox';
      if (/MSIE|Trident/.test(ua)) return 'Internet Explorer';
      return 'Unknown Browser';
    },

    _detectOS: function () {
      if (typeof navigator === 'undefined') return 'Server';
      var ua = navigator.userAgent;
      if (/Win/.test(ua)) return 'Windows';
      if (/Mac/.test(ua)) return 'macOS';
      if (/Linux/.test(ua)) return 'Linux';
      if (/Android/.test(ua)) return 'Android';
      if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
      return 'Unknown OS';
    },

    _send: function (payload) {
      var self = this;
      var signature = (payload.exception_type || '') + ':' + (payload.message || '') + ':' + (payload.stack_trace || '').slice(0, 100);
      var now = Date.now();

      // Deduplicate identical error within 1000ms
      if (self._recentSignatures[signature] && (now - self._recentSignatures[signature] < 1000)) {
        return Promise.resolve({ deduplicated: true });
      }
      self._recentSignatures[signature] = now;

      var url = this.config.endpoint + '/api/errors';
      var headers = {
        'Content-Type': 'application/json',
        'X-API-Key': this.config.apiKey,
      };

      if (this.config.debug) {
        console.log('[Faultline] Sending error event:', payload);
      }

      if (typeof fetch === 'function') {
        return fetch(url, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(payload),
        })
          .then(function (response) {
            if (!response.ok) {
              return response.text().then(function (errText) {
                if (self.config.debug) console.error('[Faultline] Ingestion error:', response.status, errText);
                throw new Error('HTTP ' + response.status + ': ' + errText);
              });
            }
            return response.json();
          })
          .catch(function (err) {
            if (self.config.debug) {
              console.error('[Faultline] Ingestion request failed:', err);
            }
            return { error: err.message };
          });
      }

      return Promise.reject(new Error('Fetch API is not available.'));
    },
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Faultline;
  } else {
    global.Faultline = Faultline;
  }
})(typeof window !== 'undefined' ? window : this);
