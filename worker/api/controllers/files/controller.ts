/**
 * FileController - Handles direct file editing for the code editor.
 *
 * Routes (all under /api/apps/:id):
 *   GET  /files                - list all files for an app (owner only)
 *   PUT  /files                - upsert a single file (owner only)
 *   DELETE /files              - delete a single file (owner only)
 */

import { BaseController } from '../baseController';
import { ApiResponse, ControllerResponse } from '../types';
import type { RouteContext } from '../../types/route-context';
import { AppService } from '../../../database/services/AppService';
import { FileStorageService } from '../../../database/services/FileStorageService';
import { createLogger } from '../../../logger';
import type { FileUpsertData, FileDeleteData, FilesListData } from './types';

export class FileController extends BaseController {
    static logger = createLogger('FileController');

    // -------------------------------------------------------
    // LIST all files for an app
    // -------------------------------------------------------
    static async listFiles(
        _request: Request,
        env: Env,
        _ctx: ExecutionContext,
        context: RouteContext,
    ): Promise<ControllerResponse<ApiResponse<FilesListData>>> {
        try {
            const appId = context.pathParams.id;
            if (!appId) {
                return FileController.createErrorResponse<FilesListData>('App ID is required', 400);
            }

            const appService = new AppService(env);
            const ownership = await appService.checkAppOwnership(appId, context.user!.id);
            if (!ownership.exists || !ownership.isOwner) {
                return FileController.createErrorResponse<FilesListData>('App not found', 404);
            }

            const fileStorage = new FileStorageService(env);
            const files = await fileStorage.getFiles(appId);
            return FileController.createSuccessResponse<FilesListData>({ files });
        } catch (error) {
            FileController.logger.error('Error listing files:', error instanceof Error ? error : new Error(String(error)));
            return FileController.createErrorResponse<FilesListData>('Failed to list files', 500);
        }
    }

    // -------------------------------------------------------
    // UPSERT a single file (create or update)
    // -------------------------------------------------------
    static async upsertFile(
        request: Request,
        env: Env,
        _ctx: ExecutionContext,
        context: RouteContext,
    ): Promise<ControllerResponse<ApiResponse<FileUpsertData>>> {
        try {
            const appId = context.pathParams.id;
            if (!appId) {
                return FileController.createErrorResponse<FileUpsertData>('App ID is required', 400);
            }

            const appService = new AppService(env);
            const ownership = await appService.checkAppOwnership(appId, context.user!.id);
            if (!ownership.exists || !ownership.isOwner) {
                return FileController.createErrorResponse<FileUpsertData>('App not found', 404);
            }

            const bodyResult = await FileController.parseJsonBody(request);
            if (!bodyResult.success) {
                return FileController.createErrorResponse<FileUpsertData>('Invalid request body', 400);
            }

            const body = bodyResult.data as { filePath?: string; content?: string };
            if (!body.filePath || typeof body.filePath !== 'string') {
                return FileController.createErrorResponse<FileUpsertData>('filePath is required', 400);
            }
            if (typeof body.content !== 'string') {
                return FileController.createErrorResponse<FileUpsertData>('content is required', 400);
            }

            const fileStorage = new FileStorageService(env);
            const file = await fileStorage.upsertFile(appId, body.filePath, body.content);
            return FileController.createSuccessResponse<FileUpsertData>({ file });
        } catch (error) {
            FileController.logger.error('Error upserting file:', error instanceof Error ? error : new Error(String(error)));
            return FileController.createErrorResponse<FileUpsertData>('Failed to save file', 500);
        }
    }

    // -------------------------------------------------------
    // DELETE a single file
    // -------------------------------------------------------
    static async deleteFile(
        request: Request,
        env: Env,
        _ctx: ExecutionContext,
        context: RouteContext,
    ): Promise<ControllerResponse<ApiResponse<FileDeleteData>>> {
        try {
            const appId = context.pathParams.id;
            if (!appId) {
                return FileController.createErrorResponse<FileDeleteData>('App ID is required', 400);
            }

            const appService = new AppService(env);
            const ownership = await appService.checkAppOwnership(appId, context.user!.id);
            if (!ownership.exists || !ownership.isOwner) {
                return FileController.createErrorResponse<FileDeleteData>('App not found', 404);
            }

            const bodyResult = await FileController.parseJsonBody(request);
            if (!bodyResult.success) {
                return FileController.createErrorResponse<FileDeleteData>('Invalid request body', 400);
            }

            const body = bodyResult.data as { filePath?: string };
            if (!body.filePath || typeof body.filePath !== 'string') {
                return FileController.createErrorResponse<FileDeleteData>('filePath is required', 400);
            }

            const fileStorage = new FileStorageService(env);
            await fileStorage.deleteFiles(appId, [body.filePath]);
            return FileController.createSuccessResponse<FileDeleteData>({
                deleted: true,
                filePath: body.filePath,
            });
        } catch (error) {
            FileController.logger.error('Error deleting file:', error instanceof Error ? error : new Error(String(error)));
            return FileController.createErrorResponse<FileDeleteData>('Failed to delete file', 500);
        }
    }
}
