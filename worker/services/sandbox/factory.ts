import { SandboxSdkClient } from "./sandboxSdkClient";
import { RemoteSandboxServiceClient } from "./remoteSandboxService";
import { LocalSandboxService } from "./localSandboxService";
import { BaseSandboxService } from "./BaseSandboxService";
import { env } from 'cloudflare:workers';
import { createLogger } from '../../logger';

const logger = createLogger('SandboxFactory');

export function getSandboxService(sessionId: string): BaseSandboxService {
    const serviceType = (env as { SANDBOX_SERVICE_TYPE?: string }).SANDBOX_SERVICE_TYPE;

    if (serviceType === 'runner') {
        logger.info("[getSandboxService] Using runner service for sandboxing");
        return new RemoteSandboxServiceClient(sessionId);
    }

    // Local/disabled mode: in-memory mock, no real preview or Cloudflare deployment
    if (serviceType === 'local' || serviceType === 'disabled') {
        logger.info(`[getSandboxService] Using local mock sandbox (SANDBOX_SERVICE_TYPE=${serviceType})`);
        return new LocalSandboxService(sessionId);
    }

    // Fallback to local mock sandbox if Sandbox binding is missing
    if (!env.Sandbox) {
        logger.warn("[getSandboxService] Sandbox binding missing, falling back to LocalSandboxService (Mock)");
        return new LocalSandboxService(sessionId);
    }

    logger.info("[getSandboxService] Using sandboxsdk service for sandboxing");
    return new SandboxSdkClient(sessionId);
}