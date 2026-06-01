// All module imports come first, BEFORE any imperative code.
// This is critical: ES module imports are hoisted and evaluated in dependency
// order. Calling initSentry() here (after all imports are resolved) prevents
// the circular TDZ error where @sentry/react tried to access react-router
// bindings before they were initialized.
import './index.css';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import type { RouterState } from 'react-router';
import { routes } from './routes.ts';
import { initSentry } from './utils/sentry';

declare global {
  interface Window {
    __staticRouterHydrationData?: Partial<
      Pick<RouterState, 'loaderData' | 'actionData' | 'errors'>
    >;
  }
}

// Initialize Sentry AFTER all imports are resolved so that react-router
// module bindings are fully initialized before Sentry tries to use them.
initSentry();

const router = createBrowserRouter(routes, {
  hydrationData: window.__staticRouterHydrationData,
});

createRoot(document.getElementById('root')!).render(
  <RouterProvider router={router} />,
);
