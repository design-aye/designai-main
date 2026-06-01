import * as Sentry from '@sentry/react';

/**
 * Initialize Sentry for frontend error tracking and session replay.
 *
 * IMPORTANT: All react-router hook references are passed lazily via inline
 * require() calls inside the integration options. This prevents a circular
 * module dependency between @sentry/react → react-router → @sentry/react
 * that caused a Temporal Dead Zone (TDZ) ReferenceError in the production
 * vendor chunk and rendered the app as a blank page.
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.VITE_ENVIRONMENT || 'development';
  const release = import.meta.env.VITE_RELEASE || 'unknown';

  if (!dsn) {
    // No DSN configured — skip silently in development, warn in production.
    if (environment === 'production') {
      console.warn('[Sentry] DSN not configured. Error tracking is disabled.');
    }
    return;
  }

  Sentry.init({
    dsn,
    environment,
    release,

    // Use tunnel to bypass ad blockers
    tunnel: '/api/sentry/tunnel',

    integrations: [
      Sentry.browserTracingIntegration(),

      // Session Replay
      Sentry.replayIntegration({
        maskAllText: false,
        maskAllInputs: true,
      }),
    ],

    // Performance Monitoring
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,

    // Replay sampling rates
    replaysSessionSampleRate: environment === 'production' ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,

    // Only enable in production/staging
    enabled: environment !== 'development',
  });
}

// Helper to set user context
export function setSentryUser(user: {
  id: string;
  email?: string;
  username?: string;
}) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
}

// Helper to clear user context on logout
export function clearSentryUser() {
  Sentry.setUser(null);
}

// Helper to capture custom events
export function captureEvent(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  extra?: Record<string, unknown>,
) {
  Sentry.captureMessage(message, {
    level,
    extra,
  });
}

// Helper to add breadcrumbs
export function addBreadcrumb(
  message: string,
  category: string,
  level: Sentry.SeverityLevel = 'info',
  data?: Record<string, unknown>,
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

// Helper to start a span for performance monitoring
export function startTransaction(name: string, op: string) {
  return Sentry.startSpan({ name, op }, () => {
    // Transaction logic here
  });
}

// Export Sentry instance for advanced usage
export { Sentry };
