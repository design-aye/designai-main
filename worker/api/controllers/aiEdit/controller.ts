import { BaseController } from '../baseController';
import { ApiResponse, ControllerResponse } from '../types';
import type { RouteContext } from '../../types/route-context';
import { AppService } from '../../../database/services/AppService';
import { infer, type InferResponseString } from '../../../agents/inferutils/core';
import { createSystemMessage, createUserMessage } from '../../../agents/inferutils/common';
import { AIModels } from '../../../agents/inferutils/config.types';
import { createLogger } from '../../../logger';
import type { AiEditRequest, AiEditData } from './types';

const SYSTEM_PROMPT = `You are a precise code editor. Apply the user's instruction to the provided code.

Rules:
- Return ONLY the complete modified file content. No explanations, no markdown fences, no preamble.
- If a selection is provided, apply the instruction only to that region and keep everything else exactly unchanged.
- Preserve the original indentation, formatting style, and line endings.
- If the instruction cannot be applied meaningfully, return the original content unchanged.`;

export class AiEditController extends BaseController {
    static logger = createLogger('AiEditController');

    static async editFile(
        request: Request,
        env: Env,
        _ctx: ExecutionContext,
        context: RouteContext,
    ): Promise<ControllerResponse<ApiResponse<AiEditData>>> {
        try {
            const appId = context.pathParams.id;
            if (!appId) {
                return AiEditController.createErrorResponse<AiEditData>('App ID is required', 400);
            }

            const appService = new AppService(env);
            const ownership = await appService.checkAppOwnership(appId, context.user!.id);
            if (!ownership.exists || !ownership.isOwner) {
                return AiEditController.createErrorResponse<AiEditData>('App not found', 404);
            }

            const bodyResult = await AiEditController.parseJsonBody(request);
            if (!bodyResult.success) {
                return AiEditController.createErrorResponse<AiEditData>('Invalid request body', 400);
            }

            const body = bodyResult.data as Partial<AiEditRequest>;
            if (!body.filePath || typeof body.filePath !== 'string') {
                return AiEditController.createErrorResponse<AiEditData>('filePath is required', 400);
            }
            if (typeof body.fileContent !== 'string') {
                return AiEditController.createErrorResponse<AiEditData>('fileContent is required', 400);
            }
            if (!body.instruction || typeof body.instruction !== 'string') {
                return AiEditController.createErrorResponse<AiEditData>('instruction is required', 400);
            }

            const userPrompt = body.selectionText?.trim()
                ? `File: ${body.filePath}\n\nSelected region to modify:\n${body.selectionText}\n\nFull file content:\n${body.fileContent}\n\nInstruction: ${body.instruction}`
                : `File: ${body.filePath}\n\nFile content:\n${body.fileContent}\n\nInstruction: ${body.instruction}`;

            const response = await infer({
                env,
                metadata: {
                    agentId: `ai-edit-${appId}`,
                    userId: context.user!.id,
                },
                messages: [
                    createSystemMessage(SYSTEM_PROMPT),
                    createUserMessage(userPrompt),
                ],
                actionKey: 'inlineCodeEdit',
                modelName: AIModels.GEMINI_2_5_FLASH,
                maxTokens: 32000,
                temperature: 0,
            }) as InferResponseString;

            return AiEditController.createSuccessResponse<AiEditData>({
                editedContent: response.string,
            });
        } catch (error) {
            AiEditController.logger.error('AI edit failed:', error instanceof Error ? error : new Error(String(error)));
            return AiEditController.createErrorResponse<AiEditData>('AI edit failed', 500);
        }
    }
}
