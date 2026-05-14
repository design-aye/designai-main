import { SandboxSdkClient } from "./sandboxSdkClient";
import { RemoteSandboxServiceClient } from "./remoteSandboxService";
import { LocalSandboxService } from "./localSandboxService";
import { BaseSandboxService } from "./BaseSandboxService";
import { env } from 'cloudflare:workers';
import { createLogger } from '../../logger';

const logger = createLogger('SandboxFactory');

export function getSandboxService(sessionId: string): BaseSandboxService {
    if ((env as { SANDBOX_SERVICE_TYPE?: string }).SANDBOX_SERVICE_TYPE === 'runner') {
        logger.info("[getSandboxService] Using runner service for sandboxing");
        return new RemoteSandboxServiceClient(sessionId);
    }

    // Fallback to local mock sandbox if Sandbox binding is missing (e.g. containers disabled and no Docker)
    if (!env.Sandbox) {
        logger.warn("[getSandboxService] Sandbox binding missing, falling back to LocalSandboxService (Mock)");
        return new LocalSandboxService(sessionId);
    }

    logger.info("[getSandboxService] Using sandboxsdk service for sandboxing");
    return new SandboxSdkClient(sessionId);
}