import { Hono } from 'hono';
import { AppEnv } from '../../types/appenv';
import { adaptController } from '../honoAdapter';
import { AuthConfig, setAuthLevel } from '../../middleware/auth/routeAuth';
import { VersionController } from '../controllers/versions/controller';

/**
 * Version history and fork routes — mounted under /api/apps/:id
 */
export function setupVersionsRoutes(app: Hono<AppEnv>): void {
    const versionRouter = new Hono<AppEnv>();

    // List all snapshots for an app (owner only)
    versionRouter.get('/:id/versions', setAuthLevel(AuthConfig.ownerOnly), adaptController(VersionController, VersionController.listSnapshots));

    // Get a single snapshot + its files (owner only)
    versionRouter.get('/:id/versions/:snapshotId', setAuthLevel(AuthConfig.ownerOnly), adaptController(VersionController, VersionController.getSnapshot));

    // Create a manual snapshot (owner only)
    versionRouter.post('/:id/versions', setAuthLevel(AuthConfig.ownerOnly), adaptController(VersionController, VersionController.createSnapshot));

    // Restore a snapshot (owner only)
    versionRouter.post('/:id/versions/:snapshotId/restore', setAuthLevel(AuthConfig.ownerOnly), adaptController(VersionController, VersionController.restoreSnapshot));

    // Fork an app (any authenticated user)
    versionRouter.post('/:id/fork', setAuthLevel(AuthConfig.authenticated), adaptController(VersionController, VersionController.forkApp));

    app.route('/api/apps', versionRouter);
}
