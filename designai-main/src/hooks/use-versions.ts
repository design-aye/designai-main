import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import type { AppSnapshot } from '@/api-types';

export function useVersions(appId: string | undefined) {
    const [snapshots, setSnapshots] = useState<AppSnapshot[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [restoringId, setRestoringId] = useState<string | null>(null);

    const fetchSnapshots = useCallback(async () => {
        if (!appId) return;
        try {
            setLoading(true);
            const response = await apiClient.listSnapshots(appId);
            setSnapshots(response.data?.snapshots ?? []);
        } catch {
            // Silently fail — panel shows empty state
        } finally {
            setLoading(false);
        }
    }, [appId]);

    useEffect(() => {
        void fetchSnapshots();
    }, [fetchSnapshots]);

    const saveSnapshot = useCallback(async (label?: string) => {
        if (!appId) return;
        try {
            setSaving(true);
            const response = await apiClient.createSnapshot(appId, label);
            if (response.data?.snapshot) {
                setSnapshots((prev) => [response.data!.snapshot, ...prev]);
                toast.success('Snapshot saved');
            }
        } catch {
            toast.error('Failed to save snapshot');
        } finally {
            setSaving(false);
        }
    }, [appId]);

    const restoreSnapshot = useCallback(async (snapshotId: string) => {
        if (!appId) return;
        try {
            setRestoringId(snapshotId);
            await apiClient.restoreSnapshot(appId, snapshotId);
            toast.success('Snapshot restored — reload the editor to see changes');
        } catch {
            toast.error('Failed to restore snapshot');
        } finally {
            setRestoringId(null);
        }
    }, [appId]);

    return {
        snapshots,
        loading,
        saving,
        restoringId,
        saveSnapshot,
        restoreSnapshot,
        refetch: fetchSnapshots,
    };
}
