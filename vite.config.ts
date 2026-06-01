import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path from 'path';
import { cloudflare } from '@cloudflare/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
	optimizeDeps: {
		exclude: ['format', 'editor.all'],
		include: ['monaco-editor/esm/vs/editor/editor.api'],
		force: true,
	},
	plugins: [
		nodePolyfills({
			include: ['os', 'path', 'crypto', 'stream', 'util', 'buffer', 'events', 'process', 'fs', 'url'],
			globals: {
				process: true,
				Buffer: true,
				global: true,
			},
		}),
		react(),
		svgr(),
		cloudflare({
			configPath: 'wrangler.jsonc',
			remoteBindings: true,
		}),
		tailwindcss(),
	],
	resolve: {
		alias: {
			mimetext: 'mimetext/browser',
			debug: 'debug/src/browser',
			'@': path.resolve(__dirname, './src'),
			'shared': path.resolve(__dirname, './shared'),
			'worker': path.resolve(__dirname, './worker'),
		},
	},
	define: {
		'process.env.NODE_ENV': JSON.stringify(
			process.env.NODE_ENV || 'development',
		),
		global: 'globalThis',
	},
	worker: {
		format: 'es',
	},
	server: {
		allowedHosts: true,
	},
	cacheDir: 'node_modules/.vite',
	build: {
		sourcemap: false,
		minify: 'terser',
		terserOptions: {
			compress: {
				drop_console: true,
			},
		},
		reportCompressedSize: false,
		chunkSizeWarningLimit: 2000,
		rollupOptions: {
			external: ['ai', 'cloudflare:workers', 'cloudflare:email'],
			// Surface circular dependency warnings so they are never silently
			// swallowed during CI builds.
			onwarn(warning, warn) {
				if (warning.code === 'CIRCULAR_DEPENDENCY') {
					// Treat circular dependencies as hard errors so the build
					// fails loudly instead of producing a broken vendor chunk.
					console.error(
						`[vite] Circular dependency detected: ${warning.message}`,
					);
				}
				warn(warning);
			},
		},
	},
	environments: {
		client: {
			build: {
				rollupOptions: {
					output: {
						manualChunks(id) {
							// Monaco Editor — very large, must be first
							if (id.includes('node_modules/monaco-editor')) {
								return 'monaco';
							}

							// Sentry — isolated in its own chunk to prevent any
							// possible circular dependency with react-router or
							// other packages that caused the TDZ blank-page crash.
							if (id.includes('@sentry')) {
								return 'sentry';
							}

							// React core + scheduler — keep these together so
							// ReactDOM always finds scheduler in the same chunk.
							// NOTE: no trailing slash on 'node_modules/react' so
							// the package root itself is correctly matched.
							if (
								id.includes('node_modules/react-dom') ||
								id.includes('node_modules/react-router') ||
								id.includes('node_modules/react/') ||
								// Match the bare react package root (e.g. .../node_modules/react/index.js)
								/node_modules\/react(?:\/|$)/.test(id) ||
								// scheduler is an internal peer of react-dom — keep co-located
								id.includes('node_modules/scheduler')
							) {
								return 'react-core';
							}

							// Radix UI primitives
							if (id.includes('node_modules/@radix-ui/')) {
								return 'ui-radix';
							}

							// Icon libraries
							if (
								id.includes('node_modules/lucide-react') ||
								id.includes('node_modules/react-feather')
							) {
								return 'ui-icons';
							}

							// Markdown / rehype / remark
							if (
								id.includes('node_modules/rehype') ||
								id.includes('node_modules/remark') ||
								id.includes('node_modules/react-markdown')
							) {
								return 'parser-md';
							}

							// Animation
							if (id.includes('node_modules/framer-motion')) {
								return 'animation';
							}

							// Forms & validation
							if (
								id.includes('node_modules/react-hook-form') ||
								id.includes('node_modules/zod')
							) {
								return 'forms';
							}

							// Generic utilities
							if (
								id.includes('node_modules/date-fns') ||
								id.includes('node_modules/lodash') ||
								id.includes('node_modules/clsx')
							) {
								return 'utils';
							}

							// Charts
							if (
								id.includes('node_modules/recharts') ||
								id.includes('node_modules/d3-') ||
								id.includes('node_modules/victory-')
							) {
								return 'charts';
							}

							// OpenAI SDK
							if (id.includes('node_modules/openai')) {
								return 'openai';
							}

							// Everything else from node_modules → vendor
							if (id.includes('node_modules')) {
								return 'vendor';
							}
						},
					},
				},
			},
		},
	},
});
