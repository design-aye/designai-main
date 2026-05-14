import { motion } from 'framer-motion';
import { Code2, Monitor, Cpu, Database, Layers, Layout, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TemplateDef {
    id: string;
    name: string;
    friendlyName: string;
    description: string;
    projectType: 'app' | 'presentation';
    tags: string[];
    icon: LucideIcon;
    starterPrompt: string;
}

const TEMPLATES: TemplateDef[] = [
    {
        id: 'minimal-js',
        name: 'minimal-js',
        friendlyName: 'Vanilla Web',
        description: 'Beautiful HTML, CSS & JavaScript with no frameworks — clean and fast.',
        projectType: 'app',
        tags: ['HTML', 'CSS', 'JS'],
        icon: Code2,
        starterPrompt: 'Build a minimal web app that ',
    },
    {
        id: 'c-code-react-runner',
        name: 'c-code-react-runner',
        friendlyName: 'React App',
        description: 'React + Vite frontend with Cloudflare Workers backend.',
        projectType: 'app',
        tags: ['React', 'Vite', 'Workers'],
        icon: Monitor,
        starterPrompt: 'Build a React app that ',
    },
    {
        id: 'reveal-presentation-pro',
        name: 'reveal-presentation-pro',
        friendlyName: 'Presentation',
        description: 'Reveal.js slide deck with glass morphism design and animations.',
        projectType: 'presentation',
        tags: ['Reveal.js', 'Slides'],
        icon: Layout,
        starterPrompt: 'Create a presentation about ',
    },
    {
        id: 'vite-cf-DO-runner',
        name: 'vite-cf-DO-runner',
        friendlyName: 'React + Backend',
        description: 'React frontend with stateful Cloudflare Durable Objects backend.',
        projectType: 'app',
        tags: ['React', 'Durable Objects'],
        icon: Layers,
        starterPrompt: 'Build a real-time React app with backend state that ',
    },
    {
        id: 'vite-cf-DO-KV-runner',
        name: 'vite-cf-DO-KV-runner',
        friendlyName: 'React + Storage',
        description: 'React app with Durable Objects and KV storage for persistent data.',
        projectType: 'app',
        tags: ['React', 'DO', 'KV'],
        icon: Database,
        starterPrompt: 'Build a React app with persistent storage that ',
    },
    {
        id: 'vite-cfagents-runner',
        name: 'vite-cfagents-runner',
        friendlyName: 'AI Agent App',
        description: 'React app powered by Cloudflare Agents SDK with MCP support.',
        projectType: 'app',
        tags: ['React', 'Agents SDK', 'MCP'],
        icon: Cpu,
        starterPrompt: 'Build an AI-powered app that ',
    },
    {
        id: 'vite-cf-DO-v2-runner',
        name: 'vite-cf-DO-v2-runner',
        friendlyName: 'React + DO v2',
        description: 'React with Cloudflare Durable Objects v2 for advanced stateful apps.',
        projectType: 'app',
        tags: ['React', 'DO v2'],
        icon: Zap,
        starterPrompt: 'Build an advanced stateful React app that ',
    },
];

interface TemplateGalleryProps {
    onSelect: (prompt: string) => void;
    className?: string;
}

export function TemplateGallery({ onSelect, className }: TemplateGalleryProps) {
    return (
        <div className={cn('w-full max-w-2xl', className)}>
            <p className="text-xs text-text-tertiary/70 mb-2 px-1">Start from a template</p>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {TEMPLATES.map((template, i) => (
                    <TemplateCard
                        key={template.id}
                        template={template}
                        index={i}
                        onSelect={() => onSelect(template.starterPrompt)}
                    />
                ))}
            </div>
        </div>
    );
}

interface TemplateCardProps {
    template: TemplateDef;
    index: number;
    onSelect: () => void;
}

function TemplateCard({ template, index, onSelect }: TemplateCardProps) {
    const Icon = template.icon;

    return (
        <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.25 }}
            onClick={onSelect}
            className={cn(
                'flex flex-col gap-1.5 p-3 rounded-xl shrink-0 w-44',
                'bg-bg-4/60 dark:bg-bg-2/60 border border-accent/10 dark:border-accent/20',
                'hover:border-accent/40 hover:bg-bg-4 dark:hover:bg-bg-2',
                'text-left transition-all duration-200 group',
            )}
            title={`Start with ${template.friendlyName} template`}
        >
            <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-accent/10 text-accent group-hover:bg-accent/20 transition-colors">
                    <Icon className="size-3.5" />
                </div>
                <span className="text-[12px] font-semibold text-text-primary leading-none truncate">
                    {template.friendlyName}
                </span>
            </div>

            <p className="text-[11px] text-text-tertiary/80 leading-snug line-clamp-2">
                {template.description}
            </p>

            <div className="flex flex-wrap gap-1 mt-0.5">
                {template.tags.slice(0, 2).map((tag) => (
                    <span
                        key={tag}
                        className="inline-flex items-center rounded-md px-1.5 py-px text-[10px] font-medium bg-accent/8 text-accent/70"
                    >
                        {tag}
                    </span>
                ))}
                {template.projectType === 'presentation' && (
                    <span className="inline-flex items-center rounded-md px-1.5 py-px text-[10px] font-medium bg-purple-500/10 text-purple-400">
                        slides
                    </span>
                )}
            </div>
        </motion.button>
    );
}
