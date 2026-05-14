/**
 * VersionController - Handles version history snapshots and app forking.
 *
 * Routes (all under /api/apps/:id):
 *   GET  /versions              - list snapshots for an app (owner only)
 *   POST /versions              - create a manual snapshot (owner only)
 *   GET  /versions/:snapshotId  - get snapshot detail + files (owner only)
 *   POST /versions/:snapshotId/restore - restore snapshot (owner only)
 *   POST /fork                  - fork a public app (authenticated)
 */

import { BaseController } from '../baseController';
import { ApiResponse, ControllerResponse } from '../types';
import type { RouteContext } from '../../types/route-context';
import { AppService } from '../../../database/services/AppService';
import { FileStorageService } from '../../../database/services/FileStorageService';
import { SnapshotService } from '../../../database/services/SnapshotService';
import { generateId } from '../../../utils/idGenerator';
import { createLogger } from '../../../logger';
import type {
    SnapshotListData,
    SnapshotDetailData,
    SnapshotCreateData,
    SnapshotRestoreData,
    ForkAppData,
} from './types';

export class VersionController extends BaseController {
    static logger = createLogger('VersionController');

    // -------------------------------------------------------
    // LIST snapshots for an app
    // -------------------------------------------------------
    static async listSnapshots(
        _request: Request,
        env: Env,
        _ctx: ExecutionContext,
        context: RouteContext,
    ): Promise<ControllerResponse<ApiResponse<SnapshotListData>>> {
        try {
            const appId = context.pathParams.id;
            if (!appId) {
                return VersionController.createErrorResponse<SnapshotListData>('App ID is required', 400);
            }

            const appService = new AppService(env);
            const ownership = await appService.checkAppOwnership(appId, context.user!.id);
            if (!ownership.exists) {
                return VersionController.createErrorResponse<SnapshotListData>('App not found', 404);
            }
            if (!ownership.isOwner) {
                return VersionController.createErrorResponse<SnapshotListData>('Forbidden', 403);
            }

            const snapshotService = new SnapshotService(env);
            const snapshots = await snapshotService.listSnapshots(appId);
            return VersionController.createSuccessResponse<SnapshotListData>({ snapshots });
        } catch (error) {
            VersionController.logger.error('Error listing snapshots:', error instanceof Error ? error : new Error(String(error)));
            return VersionController.createErrorResponse<SnapshotListData>('Failed to list snapshots', 500);
        }
    }

    // -------------------------------------------------------
    // GET a single snapshot + its files
    // -------------------------------------------------------
    static async getSnapshot(
        _request: Request,
        env: Env,
        _ctx: ExecutionContext,
        context: RouteContext,
    ): Promise<ControllerResponse<ApiResponse<SnapshotDetailData>>> {
        try {
            const { id: appId, snapshotId } = context.pathParams;
            if (!appId || !snapshotId) {
                return VersionController.createErrorResponse<SnapshotDetailData>('App ID and Snapshot ID are required', 400);
            }

            const appService = new AppService(env);
            const ownership = await appService.checkAppOwnership(appId, context.user!.id);
            if (!ownership.exists || !ownership.isOwner) {
                return VersionController.createErrorResponse<SnapshotDetailData>('App not found', 404);
            }

            const snapshotService = new SnapshotService(env);
            const snapshot = await snapshotService.getSnapshot(snapshotId);
            if (!snapshot || snapshot.appId !== appId) {
                return VersionController.createErrorResponse<SnapshotDetailData>('Snapshot not found', 404);
            }

            const files = await snapshotService.getSnapshotFiles(snapshotId);
            return VersionController.createSuccessResponse<SnapshotDetailData>({ snapshot, files });
        } catch (error) {
            VersionController.logger.error('Error fetching snapshot:', error instanceof Error ? error : new Error(String(error)));
            return VersionController.createErrorResponse<SnapshotDetailData>('Failed to fetch snapshot', 500);
        }
    }

    // -------------------------------------------------------
    // CREATE a manual snapshot
    // -------------------------------------------------------
    static async createSnapshot(
        request: Request,
        env: Env,
        _ctx: ExecutionContext,
        context: RouteContext,
    ): Promise<ControllerResponse<ApiResponse<SnapshotCreateData>>> {
        try {
            const appId = context.pathParams.id;
            if (!appId) {
                return VersionController.createErrorResponse<SnapshotCreateData>('App ID is required', 400);
            }

            const appService = new AppService(env);
            const ownership = await appService.checkAppOwnership(appId, context.user!.id);
            if (!ownership.exists || !ownership.isOwner) {
                return VersionController.createErrorResponse<SnapshotCreateData>('App not found', 404);
            }

            const bodyResult = await VersionController.parseJsonBody(request);
            const label: string = (bodyResult.success && (bodyResult.data as { label?: string })?.label)
                ? String((bodyResult.data as { label: string }).label)
                : `Manual snapshot — ${new Date().toISOString()}`;

            // Read current live files from app_files table
            const fileStorageService = new FileStorageService(env);
            const liveFiles = await fileStorageService.getFiles(appId);

            if (liveFiles.length === 0) {
                return VersionController.createErrorResponse<SnapshotCreateData>(
                    'No files found for this app. Generate the app first before saving a snapshot.',
                    400,
                );
            }

            const snapshotService = new SnapshotService(env);
            const snapshot = await snapshotService.createSnapshot(
                appId,
                liveFiles.map(f => ({ filePath: f.filePath, content: f.content })),
                label,
                'manual',
            );

            return VersionController.createSuccessResponse<SnapshotCreateData>({ snapshot });
        } catch (error) {
            VersionController.logger.error('Error creating snapshot:', error instanceof Error ? error : new Error(String(error)));
            return VersionController.createErrorResponse<SnapshotCreateData>('Failed to create snapshot', 500);
        }
    }

    // -------------------------------------------------------
    // RESTORE a snapshot
    // -------------------------------------------------------
    static async restoreSnapshot(
        _request: Request,
        env: Env,
        _ctx: ExecutionContext,
        context: RouteContext,
    ): Promise<ControllerResponse<ApiResponse<SnapshotRestoreData>>> {
        try {
            const { id: appId, snapshotId } = context.pathParams;
            if (!appId || !snapshotId) {
                return VersionController.createErrorResponse<SnapshotRestoreData>('App ID and Snapshot ID are required', 400);
            }

            const appService = new AppService(env);
            const ownership = await appService.checkAppOwnership(appId, context.user!.id);
            if (!ownership.exists || !ownership.isOwner) {
                return VersionController.createErrorResponse<SnapshotRestoreData>('App not found', 404);
            }

            const snapshotService = new SnapshotService(env);
            const snapshot = await snapshotService.getSnapshot(snapshotId);
            if (!snapshot || snapshot.appId !== appId) {
                return VersionController.createErrorResponse<SnapshotRestoreData>('Snapshot not found', 404);
            }

            const restoredFiles = await snapshotService.restoreSnapshot(appId, snapshotId);

            return VersionController.createSuccessResponse<SnapshotRestoreData>({
                snapshot,
                fileCount: restoredFiles.length,
            });
        } catch (error) {
            VersionController.logger.error('Error restoring snapshot:', error instanceof Error ? error : new Error(String(error)));
            return VersionController.createErrorResponse<SnapshotRestoreData>('Failed to restore snapshot', 500);
        }
    }

    // -------------------------------------------------------
    // FORK an app (any authenticated user can fork a public app)
    // -------------------------------------------------------
    static async forkApp(
        _request: Request,
        env: Env,
        _ctx: ExecutionContext,
        context: RouteContext,
    ): Promise<ControllerResponse<ApiResponse<ForkAppData>>> {
        try {
            const sourceAppId = context.pathParams.id;
            if (!sourceAppId) {
                return VersionController.createErrorResponse<ForkAppData>('App ID is required', 400);
            }

            const appService = new AppService(env);
            const sourceApp = await appService.getSingleAppWithFavoriteStatus(sourceAppId, context.user!.id);

            if (!sourceApp) {
                return VersionController.createErrorResponse<ForkAppData>('App not found', 404);
            }

            // Only public apps (or the owner's own private apps) can be forked
            if (sourceApp.visibility === 'private' && sourceApp.userId !== context.user!.id) {
                return VersionController.createErrorResponse<ForkAppData>('Cannot fork a private app', 403);
            }

            // Load the source app's files
            const fileStorageService = new FileStorageService(env);
            const sourceFiles = await fileStorageService.getFiles(sourceAppId);

            if (sourceFiles.length === 0) {
                return VersionController.createErrorResponse<ForkAppData>(
                    'Source app has no stored files. Ask the owner to save a snapshot first.',
                    400,
                );
            }

            // Create the forked app record
            const forkedApp = await appService.createApp({
                id: generateId(),
                title: `Fork of ${sourceApp.title}`,
                description: sourceApp.description,
                iconUrl: sourceApp.iconUrl,
                originalPrompt: sourceApp.originalPrompt,
                finalPrompt: sourceApp.finalPrompt,
                framework: sourceApp.framework,
                userId: context.user!.id,
                sessionToken: null,
                visibility: 'private',
                status: 'completed',
                deploymentId: null,
                githubRepositoryUrl: null,
                githubRepositoryVisibility: null,
                isArchived: false,
                isFeatured: false,
                version: 1,
                parentAppId: sourceAppId,
                screenshotUrl: sourceApp.screenshotUrl,
                screenshotCapturedAt: null,
            });

            // Copy files to the new app
            await fileStorageService.upsertFiles(
                forkedApp.id,
                sourceFiles.map(f => ({ filePath: f.filePath, content: f.content })),
            );

            // Create a fork_source snapshot on the new app
            const snapshotService = new SnapshotService(env);
            await snapshotService.createSnapshot(
                forkedApp.id,
                sourceFiles.map(f => ({ filePath: f.filePath, content: f.content })),
                `Forked from "${sourceApp.title}"`,
                'fork_source',
            );

            return VersionController.createSuccessResponse<ForkAppData>({
                app: forkedApp,
                message: `Successfully forked "${sourceApp.title}"`,
            });
        } catch (error) {
            VersionController.logger.error('Error forking app:', error instanceof Error ? error : new Error(String(error)));
            return VersionController.createErrorResponse<ForkAppData>('Failed to fork app', 500);
        }
    }
}
