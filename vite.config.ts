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
			output: {
				manualChunks(id) {
					if (id.includes('node_modules/monaco-editor')) {
						return 'monaco';
					}
					if (id.includes('@sentry')) {
						return 'sentry';
					}
					if (id.includes('node_modules/@radix-ui/')) {
						return 'ui-radix';
					}
					if (id.includes('node_modules/lucide-react') || id.includes('node_modules/react-feather')) {
						return 'ui-icons';
					}
					if (id.includes('node_modules/rehype') || id.includes('node_modules/remark') || id.includes('node_modules/react-markdown')) {
						return 'parser-md';
					}
					if (id.includes('node_modules/framer-motion')) {
						return 'animation';
					}
					if (id.includes('node_modules/react-hook-form') || id.includes('node_modules/zod')) {
						return 'forms';
					}
					if (id.includes('node_modules/date-fns') || id.includes('node_modules/lodash') || id.includes('node_modules/clsx')) {
						return 'utils';
					}
					if (id.includes('node_modules/@babel/')) {
						return 'babel';
					}
					if (id.includes('node_modules/react-dom') || id.includes('node_modules/react-router') || id.includes('node_modules/react/')) {
						return 'react-core';
					}
					if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-') || id.includes('node_modules/victory-')) {
						return 'charts';
					}
					if (id.includes('node_modules/openai')) {
						return 'openai';
					}
					if (id.includes('node_modules')) {
						return 'vendor';
					}
				},
			},
		},
	},
});
