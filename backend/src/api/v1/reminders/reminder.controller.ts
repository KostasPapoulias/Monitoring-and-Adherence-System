import { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ReminderJobModel } from './reminder-job.model';
import { Logger } from '../../shared/utils/logger';

export class ReminderController {
  private logger: Logger = new Logger();

  public applyRoutes(): Router {
    const router = Router();
    router
      .get('/', this.list)
      .post('/regenerate', this.regenerateToday);
    return router;
  }

  list = async (req: Request, res: Response) => {
    const status = req.query.status as string | undefined;
    const query: any = {};
    if (status) query.status = status;
    const jobs = await ReminderJobModel.find(query).sort({ scheduledAt: 1 }).lean().exec();
    return res.status(StatusCodes.OK).json(jobs);
  };

  regenerateToday = async (_req: Request, res: Response) => {
    // This endpoint is a stub; generation is handled by the scheduler service.
    this.logger.debug('regenerateToday called but handled by scheduler');
    return res.status(StatusCodes.ACCEPTED).json({ regenerated: true });
  };
}
