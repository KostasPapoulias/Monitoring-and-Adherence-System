import { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Logger } from '../../shared/utils/logger';
import { AdherenceEventModel } from '../adherence/adherence-event.model';
import { PersonaModel } from '../personas/persona.model';

const MISSED_THRESHOLD = 3; // repeated misses before alerting

export class AlertsController {
  private logger: Logger = new Logger();

  public applyRoutes(): Router {
    const router = Router();
    router
      .post('/trigger', this.triggerAlert)
      .get('/health', this.health)
      .get('/rules/preview', this.previewRules);
    return router;
  }

  health = async (_req: Request, res: Response) => {
    return res.status(StatusCodes.OK).json({ status: 'ok' });
  };

  triggerAlert = async (req: Request, res: Response) => {
    this.logger.debug('triggerAlert request');
    const payload = req.body || {};
    // In real life, dispatch via SMS/email/push; here we just return the payload.
    return res.status(StatusCodes.OK).json({
      sent: true,
      channel: payload.channel || 'app',
      reason: payload.reason || 'manual',
      at: new Date(),
      userId: payload.userId,
      medicationId: payload.medicationId
    });
  };

  previewRules = async (req: Request, res: Response) => {
    const userId = (req.query.userId as string) || undefined;
    if (!userId) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'userId is required' });
    }
    // count missed events in last 7 days
    const since = new Date();
    since.setDate(since.getDate() - 7);
    const missedCount = await AdherenceEventModel.countDocuments({ userId, type: 'missed', scheduledAt: { $gte: since } });
    const persona = await PersonaModel.findById(userId).lean().exec();
    const shouldAlert = missedCount >= MISSED_THRESHOLD;
    return res.status(StatusCodes.OK).json({ missedCount, threshold: MISSED_THRESHOLD, shouldAlert, persona });
  };
}
