import { Hono } from 'hono';
import { AppEnv } from '../../types/appenv';
import { adaptController } from '../honoAdapter';
import { AuthConfig, setAuthLevel } from '../../middleware/auth/routeAuth';
import { AiEditController } from '../controllers/aiEdit/controller';

export function setupAiEditRoutes(app: Hono<AppEnv>): void {
    const aiEditRouter = new Hono<AppEnv>();

    aiEditRouter.post(
        '/:id/ai-edit',
        setAuthLevel(AuthConfig.ownerOnly),
        adaptController(AiEditController, AiEditController.editFile),
    );

    app.route('/api/apps', aiEditRouter);
}
