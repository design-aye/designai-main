/**
 * SnapshotService - Creates and restores named version snapshots for apps.
 *
 * A snapshot captures the full file state of an app at a moment in time so
 * users can roll back to any previous version (like "git stash" or Lovable's
 * restore points).
 *
 * Snapshots are created automatically:
 *   - After initial generation completes (trigger: 'generation')
 *   - After a successful deploy (trigger: 'deploy')
 *   - When a fork is created from an app (trigger: 'fork_source')
 *
 * Users can also create manual snapshots from the UI (trigger: 'manual').
 */

import { BaseService } from './BaseService';
import * as schema from '../schema';
import { eq, desc } from 'drizzle-orm';
import { generateId } from '../../utils/idGenerator';
import type { FileEntry } from './FileStorageService';

export type SnapshotTrigger = 'generation' | 'deploy' | 'manual' | 'fork_source';

export type SnapshotWithFileCount = schema.AppSnapshot & { fileCount: number };

export class SnapshotService extends BaseService {

    /**
     * Create a new snapshot from the provided files map.
     * Inserts a snapshot header row and all file content rows in a batch.
     */
    async createSnapshot(
        appId: string,
        files: FileEntry[],
        label: string,
        trigger: SnapshotTrigger = 'manual',
    ): Promise<schema.AppSnapshot> {
        const snapshotId = generateId();
        const now = new Date();
        const encoder = new TextEncoder();

        const [snapshot] = await this.database
            .insert(schema.appSnapshots)
            .values({
                id: snapshotId,
                appId,
                label,
                trigger,
                fileCount: files.length,
                createdAt: now,
            })
            .returning();

        if (files.length > 0) {
            const snapshotFileRows: schema.NewAppSnapshotFile[] = files.map(({ filePath, content }) => ({
                id: generateId(),
                snapshotId,
                appId,
                filePath,
                content,
                sizeBytes: encoder.encode(content).length,
            }));

            await this.database
                .insert(schema.appSnapshotFiles)
                .values(snapshotFileRows);
        }

        return snapshot;
    }

    /**
     * List all snapshots for an app, newest first.
     */
    async listSnapshots(appId: string): Promise<schema.AppSnapshot[]> {
        return this.getReadDb()
            .select()
            .from(schema.appSnapshots)
            .where(eq(schema.appSnapshots.appId, appId))
            .orderBy(desc(schema.appSnapshots.createdAt));
    }

    /**
     * Return a specific snapshot header (no files).
     */
    async getSnapshot(snapshotId: string): Promise<schema.AppSnapshot | null> {
        const [snapshot] = await this.getReadDb()
            .select()
            .from(schema.appSnapshots)
            .where(eq(schema.appSnapshots.id, snapshotId));
        return snapshot ?? null;
    }

    /**
     * Return all files captured in a snapshot.
     */
    async getSnapshotFiles(snapshotId: string): Promise<schema.AppSnapshotFile[]> {
        return this.getReadDb()
            .select()
            .from(schema.appSnapshotFiles)
            .where(eq(schema.appSnapshotFiles.snapshotId, snapshotId));
    }

    /**
     * Restore a snapshot: overwrites the live app_files rows with the snapshot's
     * file contents, effectively rolling the app back to that point in time.
     * Returns the snapshot files so the caller can also push them back into the
     * agent's in-memory generatedFilesMap.
     */
    async restoreSnapshot(
        appId: string,
        snapshotId: string,
    ): Promise<schema.AppSnapshotFile[]> {
        const snapshot = await this.getSnapshot(snapshotId);
        if (!snapshot || snapshot.appId !== appId) {
            throw new Error(`Snapshot ${snapshotId} not found for app ${appId}`);
        }

        const files = await this.getSnapshotFiles(snapshotId);
        const encoder = new TextEncoder();
        const now = new Date();

        // Delete current live files and replace with snapshot contents
        await this.database
            .delete(schema.appFiles)
            .where(eq(schema.appFiles.appId, appId));

        if (files.length > 0) {
            const liveRows: schema.NewAppFile[] = files.map(({ filePath, content }) => ({
                id: generateId(),
                appId,
                filePath,
                content,
                sizeBytes: encoder.encode(content).length,
                createdAt: now,
                updatedAt: now,
            }));

            await this.database
                .insert(schema.appFiles)
                .values(liveRows);
        }

        return files;
    }

    /**
     * Delete a snapshot and all its files.
     */
    async deleteSnapshot(snapshotId: string): Promise<void> {
        await this.database
            .delete(schema.appSnapshots)
            .where(eq(schema.appSnapshots.id, snapshotId));
    }
}
