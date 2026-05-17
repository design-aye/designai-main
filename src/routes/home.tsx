import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { ArrowRight, Zap, Code2, Rocket, Globe } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/auth-context';
import {
	AgentModeToggle,
	type AgentMode,
} from '../components/agent-mode-toggle';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { usePaginatedApps } from '@/hooks/use-paginated-apps';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { AppCard } from '@/components/shared/AppCard';
import { TemplateGallery } from '@/components/shared/TemplateGallery';
import clsx from 'clsx';
import { useImageUpload } from '@/hooks/use-image-upload';
import { useDragDrop } from '@/hooks/use-drag-drop';
import { ImageUploadButton } from '@/components/image-upload-button';
import { ImageAttachmentPreview } from '@/components/image-attachment-preview';
import { SUPPORTED_IMAGE_MIME_TYPES } from '@/api-types';

const FEATURES = [
	{ icon: Zap,    label: 'Instant generation',    desc: 'From idea to working app in seconds' },
	{ icon: Code2,  label: 'Production-ready code',  desc: 'Clean TypeScript, React, Cloudflare Workers' },
	{ icon: Rocket, label: 'One-click deploy',       desc: 'Ship directly to Cloudflare global edge' },
	{ icon: Globe,  label: 'Always online',          desc: 'Built on Cloudflare — 99.99% uptime' },
];

export default function Home() {
	const navigate = useNavigate();
	const { requireAuth } = useAuthGuard();
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const [agentMode, setAgentMode] = useState<AgentMode>('deterministic');
	const [query, setQuery] = useState('');
	useAuth();

	const { images, addImages, removeImage, clearImages, isProcessing } = useImageUpload({
		onError: () => {
			console.error('Image upload error');
		},
	});

	const { isDragging, dragHandlers } = useDragDrop({
		onFilesDropped: addImages,
		accept: [...SUPPORTED_IMAGE_MIME_TYPES],
	});

	const placeholderPhrases = useMemo(() => [
		'a real-time collaboration tool',
		'a personal finance dashboard',
		'an F1 fantasy game',
		'a todo app with AI suggestions',
		'a SaaS landing page',
	], []);

	const [currentPlaceholderPhraseIndex, setCurrentPlaceholderPhraseIndex] = useState(0);
	const [currentPlaceholderText, setCurrentPlaceholderText] = useState('');
	const [isPlaceholderTyping, setIsPlaceholderTyping] = useState(true);

	const { apps, loading } = usePaginatedApps({
		type: 'public',
		defaultSort: 'popular',
		defaultPeriod: 'week',
		limit: 6,
	});

	const discoverReady = useMemo(() => !loading && (apps?.length ?? 0) > 5, [loading, apps]);

	const handleFork = useCallback(async (appId: string) => {
		try {
			const response = await apiClient.forkApp(appId);
			if (response.data?.app) {
				toast.success(response.data.message || 'App forked successfully');
				navigate(`/chat/${response.data.app.id}`);
			}
		} catch {
			toast.error('Failed to fork app');
		}
	}, [navigate]);

	const handleCreateApp = (q: string, mode: AgentMode) => {
		const encodedQuery = encodeURIComponent(q);
		const encodedMode = encodeURIComponent(mode);
		const imageParam = images.length > 0 ? `&images=${encodeURIComponent(JSON.stringify(images))}` : '';
		const intendedUrl = `/chat/new?query=${encodedQuery}&agentMode=${encodedMode}${imageParam}`;

		if (!requireAuth({ requireFullAuth: true, actionContext: 'to create applications', intendedUrl })) return;
		navigate(intendedUrl);
		clearImages();
	};

	const adjustTextareaHeight = () => {
		if (textareaRef.current) {
			textareaRef.current.style.height = 'auto';
			textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 280) + 'px';
		}
	};

	useEffect(() => { adjustTextareaHeight(); }, []);

	useEffect(() => {
		const phrase = placeholderPhrases[currentPlaceholderPhraseIndex];
		if (isPlaceholderTyping) {
			if (currentPlaceholderText.length < phrase.length) {
				const t = setTimeout(() => setCurrentPlaceholderText(phrase.slice(0, currentPlaceholderText.length + 1)), 80);
				return () => clearTimeout(t);
			} else {
				const t = setTimeout(() => setIsPlaceholderTyping(false), 2200);
				return () => clearTimeout(t);
			}
		} else {
			if (currentPlaceholderText.length > 0) {
				const t = setTimeout(() => setCurrentPlaceholderText(prev => prev.slice(0, -1)), 40);
				return () => clearTimeout(t);
			} else {
				setCurrentPlaceholderPhraseIndex(prev => (prev + 1) % placeholderPhrases.length);
				setIsPlaceholderTyping(true);
			}
		}
	}, [currentPlaceholderText, currentPlaceholderPhraseIndex, isPlaceholderTyping, placeholderPhrases]);

	return (
		<div className="relative flex flex-col items-center w-full min-h-full overflow-x-hidden">

			{/* ── Background mesh ──────────────────────────────── */}
			<div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
				{/* Dot grid */}
				<div className="absolute inset-0 bg-dot-pattern opacity-100" />

				{/* Violet glow orb — top center */}
				<div
					className="hero-glow absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full pointer-events-none"
					style={{
						background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.18) 0%, rgba(79,70,229,0.08) 50%, transparent 75%)',
						filter: 'blur(40px)',
					}}
				/>

				{/* Subtle bottom glow */}
				<div
					className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] pointer-events-none"
					style={{
						background: 'radial-gradient(ellipse at center, rgba(249,115,22,0.07) 0%, transparent 70%)',
						filter: 'blur(30px)',
					}}
				/>
			</div>

			<LayoutGroup>
				<motion.div
					layout
					transition={{ layout: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } }}
					className={clsx(
						'relative z-10 w-full max-w-2xl px-4',
						discoverReady ? 'mt-24 mb-4' : 'mt-[14vh] sm:mt-[18vh] md:mt-[20vh] mb-8',
					)}
				>
					{/* ── Badge ──────────────────────────────────── */}
					<motion.div
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.4 }}
						className="flex justify-center mb-6"
					>
						<span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border border-accent/30 bg-accent/8 text-accent">
							<span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
							Powered by Cloudflare Workers AI
						</span>
					</motion.div>

					{/* ── Headline ────────────────────────────────── */}
					<motion.h1
						initial={{ opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.05 }}
						className="text-center font-bold leading-[1.08] tracking-tight mb-4"
						style={{ fontSize: 'clamp(2.2rem, 5vw, 3.4rem)' }}
					>
						<span className="gradient-text">Build any app</span>
						<br />
						<span className="text-text-primary">with a single prompt</span>
					</motion.h1>

					{/* ── Sub-headline ─────────────────────────────── */}
					<motion.p
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.45, delay: 0.12 }}
						className="text-center text-text-tertiary text-base mb-8 max-w-lg mx-auto leading-relaxed"
					>
						Describe your idea. DesignAI writes the code, deploys it, and iterates — all in real time.
					</motion.p>

					{/* ── Prompt card ──────────────────────────────── */}
					<motion.div
						initial={{ opacity: 0, y: 16 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.18 }}
					>
						<form
							method="POST"
							onSubmit={(e) => {
								e.preventDefault();
								handleCreateApp(textareaRef.current!.value, agentMode);
							}}
							className={clsx(
								'prompt-input-wrap flex flex-col w-full bg-bg-4 dark:bg-bg-2 rounded-2xl border border-border-primary transition-all duration-200',
								'p-4',
							)}
						>
							<div
								className={clsx(
									'flex-1 flex flex-col relative',
									isDragging && 'ring-2 ring-accent/60 ring-offset-2 rounded-xl',
								)}
								{...dragHandlers}
							>
								{isDragging && (
									<div className="absolute inset-0 flex items-center justify-center bg-accent/10 backdrop-blur-sm rounded-xl z-30 pointer-events-none">
										<p className="text-accent font-medium text-sm">Drop images here</p>
									</div>
								)}
								<textarea
									className="w-full resize-none ring-0 z-20 outline-none placeholder:text-text-tertiary text-text-primary bg-transparent text-[15px] leading-relaxed min-h-[80px]"
									name="query"
									value={query}
									placeholder={`Build ${currentPlaceholderText}▋`}
									ref={textareaRef}
									onChange={(e) => { setQuery(e.target.value); adjustTextareaHeight(); }}
									onInput={adjustTextareaHeight}
									onKeyDown={(e) => {
										if (e.key === 'Enter' && !e.shiftKey) {
											e.preventDefault();
											handleCreateApp(textareaRef.current!.value, agentMode);
										}
									}}
								/>
								{images.length > 0 && (
									<div className="mt-2">
										<ImageAttachmentPreview images={images} onRemove={removeImage} />
									</div>
								)}
							</div>

							<div className="flex items-center justify-between mt-3 pt-2 border-t border-border-secondary">
								{import.meta.env.VITE_AGENT_MODE_ENABLED ? (
									<AgentModeToggle value={agentMode} onChange={setAgentMode} className="flex-1" />
								) : (
									<div className="flex-1" />
								)}

								<div className="flex items-center gap-2">
									<ImageUploadButton onFilesSelected={addImages} disabled={isProcessing} />
									<button
										type="submit"
										disabled={!query.trim()}
										className={clsx(
											'flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
											'bg-accent text-white hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/25',
											'disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none',
										)}
									>
										<span>Build</span>
										<ArrowRight className="w-3.5 h-3.5" />
									</button>
								</div>
							</div>
						</form>
					</motion.div>

					{/* ── Template gallery ──────────────────────────── */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.4, delay: 0.3 }}
					>
						<TemplateGallery
							onSelect={(prompt) => {
								setQuery(prompt);
								textareaRef.current?.focus();
								requestAnimationFrame(() => {
									if (textareaRef.current) {
										const len = textareaRef.current.value.length;
										textareaRef.current.setSelectionRange(len, len);
										adjustTextareaHeight();
									}
								});
							}}
							className="mt-4"
						/>
					</motion.div>

					{/* ── Feature pills ─────────────────────────────── */}
					{!discoverReady && (
						<motion.div
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.4, delay: 0.38 }}
							className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-8"
						>
							{FEATURES.map(({ icon: Icon, label, desc }) => (
								<div
									key={label}
									className="flex flex-col gap-1 p-3 rounded-xl border border-border-primary bg-bg-4/50 dark:bg-bg-2/50 hover:border-accent/30 transition-colors duration-200"
								>
									<div className="flex items-center gap-1.5 mb-0.5">
										<Icon className="w-3.5 h-3.5 text-accent flex-shrink-0" />
										<span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">{label}</span>
									</div>
									<p className="text-[11px] text-text-tertiary leading-snug">{desc}</p>
								</div>
							))}
						</motion.div>
					)}
				</motion.div>

				{/* ── Image info banner ─────────────────────────── */}
				<AnimatePresence>
					{images.length > 0 && (
						<motion.div
							initial={{ opacity: 0, y: -8 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -8 }}
							className="relative z-10 w-full max-w-2xl px-4 mb-3"
						>
							<div className="flex items-start gap-2 px-3.5 py-2.5 rounded-xl bg-accent/8 border border-accent/20">
								<Zap className="w-3.5 h-3.5 text-accent flex-shrink-0 mt-0.5" />
								<p className="text-xs text-text-tertiary leading-relaxed">
									<span className="font-medium text-text-secondary">Images (Beta):</span> Images guide app layout but may not be replicated exactly.
								</p>
							</div>
						</motion.div>
					)}
				</AnimatePresence>

				{/* ── Community showcase ────────────────────────── */}
				<AnimatePresence>
					{discoverReady && (
						<motion.section
							key="discover-section"
							layout
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
							className="relative z-10 w-full max-w-6xl mx-auto px-4 mt-6 mb-12"
						>
							{/* Section header */}
							<div className="flex items-end justify-between mb-5">
								<div>
									<h2 className="text-xl font-semibold text-text-primary mb-0.5">Built by the community</h2>
									<p className="text-sm text-text-tertiary">See what others have created with DesignAI</p>
								</div>
								<button
									onClick={() => navigate('/discover')}
									className="text-sm font-medium text-accent hover:text-accent/80 transition-colors flex items-center gap-1"
								>
									View all <ArrowRight className="w-3.5 h-3.5" />
								</button>
							</div>

							<motion.div
								layout
								className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
							>
								<AnimatePresence mode="popLayout">
									{apps.map(app => (
										<AppCard
											key={app.id}
											app={app}
											onClick={() => navigate(`/app/${app.id}`)}
											onFork={handleFork}
											showStats={true}
											showUser={true}
											showActions={false}
										/>
									))}
								</AnimatePresence>
							</motion.div>
						</motion.section>
					)}
				</AnimatePresence>
			</LayoutGroup>
		</div>
	);
}
