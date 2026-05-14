/**
 * FileStorageService - Persists generated app files to D1.
 * Provides upsert (save/overwrite) and batch operations so the agent
 * can push the full generatedFilesMap to durable storage at the end of
 * each generation phase or on demand.
 */

import { BaseService } from './BaseService';
import * as schema from '../schema';
import { eq, inArray } from 'drizzle-orm';
import { generateId } from '../../utils/idGenerator';

export type FileEntry = { filePath: string; content: string };

export class FileStorageService extends BaseService {

    /**
     * Upsert a single file for an app.
     * If a record for (appId, filePath) already exists it is overwritten.
     */
    async upsertFile(appId: string, filePath: string, content: string): Promise<schema.AppFile> {
        const now = new Date();
        const [file] = await this.database
            .insert(schema.appFiles)
            .values({
                id: generateId(),
                appId,
                filePath,
                content,
                sizeBytes: new TextEncoder().encode(content).length,
                createdAt: now,
                updatedAt: now,
            })
            .onConflictDoUpdate({
                target: [schema.appFiles.appId, schema.appFiles.filePath],
                set: {
                    content,
                    sizeBytes: new TextEncoder().encode(content).length,
                    updatedAt: now,
                },
            })
            .returning();
        return file;
    }

    /**
     * Upsert a batch of files for an app in a single transaction.
     * Suitable for saving the entire generatedFilesMap at once.
     */
    async upsertFiles(appId: string, files: FileEntry[]): Promise<void> {
        if (files.length === 0) return;

        const now = new Date();
        const encoder = new TextEncoder();

        const rows: schema.NewAppFile[] = files.map(({ filePath, content }) => ({
            id: generateId(),
            appId,
            filePath,
            content,
            sizeBytes: encoder.encode(content).length,
            createdAt: now,
            updatedAt: now,
        }));

        // D1 batch insert; conflict = overwrite with latest content
        await this.database
            .insert(schema.appFiles)
            .values(rows)
            .onConflictDoUpdate({
                target: [schema.appFiles.appId, schema.appFiles.filePath],
                set: {
                    content: schema.appFiles.content,
                    sizeBytes: schema.appFiles.sizeBytes,
                    updatedAt: schema.appFiles.updatedAt,
                },
            });
    }

    /**
     * Return all persisted files for an app.
     */
    async getFiles(appId: string): Promise<schema.AppFile[]> {
        return this.getReadDb().select().from(schema.appFiles)
            .where(eq(schema.appFiles.appId, appId));
    }

    /**
     * Return a single persisted file or null if not found.
     */
    async getFile(appId: string, filePath: string): Promise<schema.AppFile | null> {
        const [file] = await this.getReadDb()
            .select()
            .from(schema.appFiles)
            .where(
                eq(schema.appFiles.appId, appId) &&
                eq(schema.appFiles.filePath, filePath) as ReturnType<typeof eq>
            );
        return file ?? null;
    }

    /**
     * Delete specific files for an app (e.g. when the agent removes a file).
     */
    async deleteFiles(appId: string, filePaths: string[]): Promise<void> {
        if (filePaths.length === 0) return;
        await this.database
            .delete(schema.appFiles)
            .where(
                eq(schema.appFiles.appId, appId) &&
                inArray(schema.appFiles.filePath, filePaths) as ReturnType<typeof eq>
            );
    }

    /**
     * Delete all persisted files for an app (e.g. on app deletion).
     */
    async deleteAllFiles(appId: string): Promise<void> {
        await this.database
            .delete(schema.appFiles)
            .where(eq(schema.appFiles.appId, appId));
    }
}
