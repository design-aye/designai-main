import { Hono } from 'hono';
import { AppEnv } from '../../types/appenv';
import { adaptController } from '../honoAdapter';
import { AuthConfig, setAuthLevel } from '../../middleware/auth/routeAuth';
import { FileController } from '../controllers/files/controller';

/**
 * File editor routes — mounted under /api/apps/:id
 */
export function setupFileRoutes(app: Hono<AppEnv>): void {
    const fileRouter = new Hono<AppEnv>();

    // List all files for an app (owner only)
    fileRouter.get('/:id/files', setAuthLevel(AuthConfig.ownerOnly), adaptController(FileController, FileController.listFiles));

    // Upsert a file — create or update (owner only)
    fileRouter.put('/:id/files', setAuthLevel(AuthConfig.ownerOnly), adaptController(FileController, FileController.upsertFile));

    // Delete a file (owner only)
    fileRouter.delete('/:id/files', setAuthLevel(AuthConfig.ownerOnly), adaptController(FileController, FileController.deleteFile));

    app.route('/api/apps', fileRouter);
}
