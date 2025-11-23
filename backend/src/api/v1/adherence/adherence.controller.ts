import { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AdherenceEventModel, IAdherenceEvent } from './adherence-event.model';
import { ResourceController } from '../../shared';
import { Logger } from '../../shared/utils/logger';
import { MedicationModel } from '../medications/medication.model';

export class AdherenceController extends ResourceController<IAdherenceEvent> {
  private logger: Logger = new Logger();

  constructor() {
    super(AdherenceEventModel);
  }

  public applyRoutes(): Router {
    const router = Router();
    router
      .get('/', this.getEvents)
      .get('/summary', this.getSummary)
      .post('/confirm', this.confirmIntake)
      .post('/postpone', this.postponeReminder);
    return router;
  }

  getEvents = async (req: Request, res: Response) => {
    this.logger.debug('getEvents request');
    const userId = (req.query.userId as string) || undefined;
    if (!userId) {
      const data = await this.getAll(req, res);
      return res.status(StatusCodes.OK).json(data);
    }
    const meds = await MedicationModel.find({ userId }).select('_id').lean().exec();
    const ids = meds.map(m => String(m._id));
    const events = await AdherenceEventModel.find({ medicationId: { $in: ids } }).lean().exec();
    return res.status(StatusCodes.OK).json(events);
  };

  getSummary = async (req: Request, res: Response) => {
    this.logger.debug('getSummary request');
    const userId = (req.query.userId as string) || undefined;
    let events: any[];
    if (!userId) {
      events = await this.getAll(req, res);
    } else {
      const meds = await MedicationModel.find({ userId }).select('_id').lean().exec();
      const ids = meds.map(m => String(m._id));
      events = await AdherenceEventModel.find({ medicationId: { $in: ids } }).lean().exec();
    }
    const totals = {
      taken: events.filter((e: any) => e.type === 'taken').length,
      missed: events.filter((e: any) => e.type === 'missed').length,
      postponed: events.filter((e: any) => e.type === 'postponed').length,
    };
    return res.status(StatusCodes.OK).json(totals);
  };

  confirmIntake = async (req: Request, res: Response) => {
    this.logger.debug('confirmIntake request');
    const body = req.body || {};
    const created = await new AdherenceEventModel({
      medicationId: body.medicationId,
      scheduledAt: body.scheduledAt,
      confirmedAt: new Date(),
      type: 'taken',
      method: body.method,
      device: body.device,
      withinWindow: body.withinWindow !== undefined ? body.withinWindow : true
    }).save();
    return res.status(StatusCodes.OK).json(created);
  };

  postponeReminder = async (req: Request, res: Response) => {
    this.logger.debug('postponeReminder request');
    const body = req.body || {};
    const created = await new AdherenceEventModel({
      medicationId: body.medicationId,
      scheduledAt: body.scheduledAt,
      type: 'postponed',
      postponeMinutes: body.postponeMinutes || 5
    }).save();
    return res.status(StatusCodes.OK).json(created);
  };
}
