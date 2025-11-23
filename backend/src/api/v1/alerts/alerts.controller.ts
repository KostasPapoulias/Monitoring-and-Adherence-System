import { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Logger } from '../../shared/utils/logger';

export class AlertsController {
  private logger: Logger = new Logger();

  public applyRoutes(): Router {
    const router = Router();
    router
      .post('/trigger', this.triggerAlert)
      .get('/health', this.health);
    return router;
  }

  health = async (_req: Request, res: Response) => {
    return res.status(StatusCodes.OK).json({ status: 'ok' });
  };

  triggerAlert = async (req: Request, res: Response) => {
    this.logger.debug('triggerAlert request');
    const payload = req.body || {};
    return res.status(StatusCodes.OK).json({
      sent: true,
      channel: payload.channel || 'app',
      reason: payload.reason || 'manual',
      at: new Date()
    });
  };
}
