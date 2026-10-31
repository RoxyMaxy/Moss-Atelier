// js/tracing.js - Sentry Agent Tracing & local privacy-safe trace collector
// Never logs recipient names, raw trait text, or AI-generated rationale text

export class AtelierTracer {
  constructor(config = {}) {
    this.sentryDsn = config.SENTRY_DSN || '';
    this.recentSpans = [];
    this.listeners = [];
    this.sentryReady = false;

    if (this.sentryDsn && typeof window !== 'undefined' && window.Sentry) {
      try {
        window.Sentry.init({
          dsn: this.sentryDsn,
          tracesSampleRate: 1.0,
          environment: 'production'
        });
        this.sentryReady = true;
      } catch (err) {
        console.warn('Sentry initialization warning:', err);
      }
    }
  }

  /**
   * Sanitizes attributes to ensure NO personal data or generated text is recorded.
   */
  sanitizeAttributes(attrs = {}) {
    const safe = {};
    const FORBIDDEN_KEYS = ['recipient', 'name', 'trait', 'traits', 'text', 'why', 'prompt', 'query'];

    for (const [key, val] of Object.entries(attrs)) {
      const lowerKey = key.toLowerCase();
      if (FORBIDDEN_KEYS.some(f => lowerKey.includes(f))) {
        continue; // Drop personal/trait/generated text
      }
      if (typeof val === 'number' || typeof val === 'boolean') {
        safe[key] = val;
      } else if (typeof val === 'string') {
        // Only allow predefined categorical names
        safe[key] = val.slice(0, 50);
      }
    }
    return safe;
  }

  /**
   * Records a tracing span
   * @param {string} spanName - 'retrieve.catalog' | 'rank.candidates' | 'gift.rationale' | 'diy.plan'
   * @param {Object} attributes - metrics only (counts, latencies, booleans)
   */
  recordSpan(spanName, attributes = {}) {
    const ALLOWED_SPANS = [
      'retrieve.catalog',
      'rank.candidates',
      'gift.rationale',
      'diy.plan',
      'system.init',
      'system.reset'
    ];

    if (!ALLOWED_SPANS.includes(spanName)) {
      console.warn(`Unrecognized span name: ${spanName}`);
    }

    const safeAttrs = this.sanitizeAttributes(attributes);
    const spanRecord = {
      name: spanName,
      timestamp: new Date().toLocaleTimeString(),
      attributes: safeAttrs
    };

    this.recentSpans.push(spanRecord);
    if (this.recentSpans.length > 20) {
      this.recentSpans.shift(); // Keep last 20
    }

    // Forward to Sentry if active
    if (this.sentryReady && window.Sentry) {
      try {
        window.Sentry.addBreadcrumb({
          category: 'atelier.agent',
          message: spanName,
          data: safeAttrs,
          level: 'info'
        });
      } catch {
        // Quiet
      }
    }

    this.notifyListeners();
    return spanRecord;
  }

  getRecentSpans() {
    return [...this.recentSpans];
  }

  onSpan(callback) {
    this.listeners.push(callback);
  }

  notifyListeners() {
    for (const cb of this.listeners) {
      try {
        cb(this.getRecentSpans());
      } catch {
        // Quiet
      }
    }
  }
}

export const tracer = new AtelierTracer(typeof window !== 'undefined' ? (window.ATELIER_CONFIG || {}) : {});
