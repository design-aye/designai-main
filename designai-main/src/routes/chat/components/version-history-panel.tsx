import { useState } from 'react';
import { History, Save, RotateCcw, LoaderCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useVersions } from '@/hooks/use-versions';
import type { AppSnapshot } from '@/api-types';
import clsx from 'clsx';

type SnapshotTrigger = AppSnapshot['trigger'];

const TRIGGER_LABELS: Record<SnapshotTrigger, string> = {
    generation: 'Generated',
    deploy: 'Deployed',
    manual: 'Manual',
    fork_source: 'Forked',
};

const TRIGGER_COLORS: Record<SnapshotTrigger, string> = {
    generation: 'bg-blue-500/15 text-blue-400',
    deploy: 'bg-green-500/15 text-green-400',
    manual: 'bg-zinc-500/15 text-zinc-400',
    fork_source: 'bg-purple-500/15 text-purple-400',
};

interface VersionHistoryPanelProps {
    appId: string | undefined;
}

export function VersionHistoryPanel({ appId }: VersionHistoryPanelProps) {
    const { snapshots, loading, saving, restoringId, saveSnapshot, restoreSnapshot } =
        useVersions(appId);

    const [labelInput, setLabelInput] = useState('');
    const [showLabelInput, setShowLabelInput] = useState(false);

    const handleSave = () => {
        if (showLabelInput) {
            void saveSnapshot(labelInput.trim() || undefined);
            setLabelInput('');
            setShowLabelInput(false);
        } else {
            setShowLabelInput(true);
        }
    };

    const formatTimestamp = (ts: Date | null) => {
        if (!ts) return 'Unknown time';
        try {
            return formatDistanceToNow(new Date(ts), { addSuffix: true });
        } catch {
            return 'Unknown time';
        }
    };

    return (
        <div className="flex flex-col bg-bg-3 border-r border-text/10 flex-1 min-h-0 overflow-hidden">
            {/* Save action */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-text/10">
                <span className="text-[11px] text-text-primary/50 font-medium">Snapshots</span>
                <button
                    onClick={handleSave}
                    disabled={saving || !appId}
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-accent/20 hover:bg-accent/30 text-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="Save a manual snapshot"
                >
                    {saving ? (
                        <LoaderCircle className="size-3 animate-spin" />
                    ) : (
                        <Save className="size-3" />
                    )}
                    Save
                </button>
            </div>

            {/* Optional label input */}
            {showLabelInput && (
                <div className="px-2 py-1.5 border-b border-border-primary flex gap-1">
                    <input
                        autoFocus
                        value={labelInput}
                        onChange={(e) => setLabelInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave();
                            if (e.key === 'Escape') {
                                setShowLabelInput(false);
                                setLabelInput('');
                            }
                        }}
                        placeholder="Snapshot label…"
                        className="flex-1 text-xs bg-bg-3 border border-border-primary rounded px-2 py-1 text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent/40 min-w-0"
                    />
                </div>
            )}

            {/* Snapshot list */}
            <div className="flex-1 overflow-y-auto">
                {loading && (
                    <div className="flex items-center justify-center py-6 text-text-tertiary">
                        <LoaderCircle className="size-4 animate-spin" />
                    </div>
                )}

                {!loading && snapshots.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 px-3 text-center gap-2">
                        <History className="size-6 text-text-tertiary/40" />
                        <p className="text-xs text-text-tertiary/60">
                            No snapshots yet. Save one to track changes.
                        </p>
                    </div>
                )}

                {!loading && snapshots.map((snapshot) => (
                    <SnapshotRow
                        key={snapshot.id}
                        snapshot={snapshot}
                        isRestoring={restoringId === snapshot.id}
                        onRestore={() => void restoreSnapshot(snapshot.id)}
                        formatTimestamp={formatTimestamp}
                    />
                ))}
            </div>
        </div>
    );
}

interface SnapshotRowProps {
    snapshot: AppSnapshot;
    isRestoring: boolean;
    onRestore: () => void;
    formatTimestamp: (ts: Date | null) => string;
}

function SnapshotRow({ snapshot, isRestoring, onRestore, formatTimestamp }: SnapshotRowProps) {
    const trigger = snapshot.trigger as SnapshotTrigger;

    return (
        <div className="group flex flex-col gap-1 px-3 py-2 border-b border-border-primary/50 hover:bg-bg-3/50 transition-colors">
            <div className="flex items-start justify-between gap-1">
                <span className="text-[11px] text-text-primary/80 leading-tight line-clamp-2 flex-1 min-w-0">
                    {snapshot.label}
                </span>
                <button
                    onClick={onRestore}
                    disabled={isRestoring}
                    className={clsx(
                        'shrink-0 p-0.5 rounded transition-colors',
                        'opacity-0 group-hover:opacity-100',
                        'text-text-tertiary hover:text-text-primary',
                        isRestoring && 'opacity-100',
                    )}
                    title="Restore this snapshot"
                >
                    {isRestoring ? (
                        <LoaderCircle className="size-3 animate-spin" />
                    ) : (
                        <RotateCcw className="size-3" />
                    )}
                </button>
            </div>
            <div className="flex items-center gap-1.5">
                <span
                    className={clsx(
                        'inline-flex items-center rounded px-1 py-px text-[10px] font-medium',
                        TRIGGER_COLORS[trigger] ?? 'bg-zinc-500/15 text-zinc-400',
                    )}
                >
                    {TRIGGER_LABELS[trigger] ?? trigger}
                </span>
                <span className="text-[10px] text-text-tertiary/60">
                    {formatTimestamp(snapshot.createdAt)}
                </span>
            </div>
            <span className="text-[10px] text-text-tertiary/50">
                {snapshot.fileCount} file{snapshot.fileCount !== 1 ? 's' : ''}
            </span>
        </div>
    );
}
