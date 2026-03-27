import { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AdherenceEventModel, IAdherenceEvent } from './adherence-event.model';
import { ResourceController } from '../../shared';
import { Logger } from '../../shared/utils/logger';
import { MedicationModel } from '../medications/medication.model';
import { DIContainer, ReminderScheduler } from '../../../services';
import { AdherenceEventType } from './adherence-event.model';

const DEFAULT_WINDOW_MINUTES = 15;

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
      .get('/report/timeseries', this.getTimeSeries)
      .get('/export', this.exportEvents)
      .post('/confirm', this.confirmIntake)
      .post('/confirm/undo', this.undoConfirmation)
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

  getTimeSeries = async (req: Request, res: Response) => {
    this.logger.debug('getTimeSeries request');
    const userId = (req.query.userId as string) || undefined;
    const period = (req.query.period as string) || 'week'; // day, week, month
    const { events } = await this.fetchEventsByUser(userId);

    const rangeDays = period === 'day' ? 1 : period === 'month' ? 30 : 7;
    const since = new Date();
    since.setDate(since.getDate() - rangeDays + 1);

    const buckets = new Map<string, { label: string; taken: number; missed: number; postponed: number }>();
    for (let i = 0; i < rangeDays; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toISOString().slice(0, 10);
      buckets.set(label, { label, taken: 0, missed: 0, postponed: 0 });
    }

    for (const e of events) {
      const day = new Date(e.scheduledAt).toISOString().slice(0, 10);
      const bucket = buckets.get(day);
      if (!bucket) continue;
      if (e.type === 'taken') bucket.taken += 1;
      if (e.type === 'missed') bucket.missed += 1;
      if (e.type === 'postponed') bucket.postponed += 1;
    }

    return res.status(StatusCodes.OK).json({ period, buckets: Array.from(buckets.values()).reverse() });
  };

  exportEvents = async (req: Request, res: Response) => {
    this.logger.debug('exportEvents request');
    const userId = (req.query.userId as string) || undefined;
    const format = (req.query.format as string) || 'csv';
    const { events } = await this.fetchEventsByUser(userId);

    if (format === 'csv') {
      const header = ['medicationId', 'userId', 'scheduledAt', 'confirmedAt', 'type', 'method', 'device', 'postponeMinutes', 'withinWindow', 'windowMinutes', 'corrected'];
      const rows = events.map(e => [
        e.medicationId,
        (e as any).userId || '',
        e.scheduledAt?.toISOString?.() || e.scheduledAt,
        e.confirmedAt ? new Date(e.confirmedAt).toISOString() : '',
        e.type,
        e.method || '',
        e.device || '',
        e.postponeMinutes || '',
        e.withinWindow === false ? 'false' : 'true',
        (e as any).windowMinutes || '',
        (e as any).corrected ? 'true' : 'false'
      ].join(','));
      const csv = [header.join(','), ...rows].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="adherence.csv"');
      return res.status(StatusCodes.OK).send(csv);
    }

    // PDF not implemented; return JSON stub
    if (format === 'pdf') {
      return res.status(StatusCodes.NOT_IMPLEMENTED).json({ message: 'PDF export not implemented in demo' });
    }

    return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Unsupported format' });
  };

  confirmIntake = async (req: Request, res: Response) => {
    this.logger.debug('confirmIntake request');
    const body = req.body || {};
    if (!body.medicationId || !body.scheduledAt) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'medicationId and scheduledAt are required' });
    }

    const med = await MedicationModel.findById(body.medicationId).lean().exec();
    const userId = med?.userId;

    // dedupe: if already taken for same medication/time, return existing
    const existing = await AdherenceEventModel.findOne({ medicationId: body.medicationId, scheduledAt: new Date(body.scheduledAt), type: 'taken' }).lean().exec();
    if (existing) {
      return res.status(StatusCodes.OK).json(existing);
    }

    const scheduledAt = new Date(body.scheduledAt);
    const confirmedAt = new Date();
    const diffMinutes = Math.abs(confirmedAt.getTime() - scheduledAt.getTime()) / 60000;
    const windowMinutes = body.windowMinutes || DEFAULT_WINDOW_MINUTES;
    const withinWindow = diffMinutes <= windowMinutes;

    const created = await new AdherenceEventModel({
      userId,
      medicationId: body.medicationId,
      scheduledAt,
      confirmedAt,
      type: 'taken',
      method: body.method,
      device: body.device,
      withinWindow,
      windowMinutes
    }).save();

    // mark any pending reminder for this med/time as acknowledged
    const scheduler = DIContainer.get(ReminderScheduler);
    if (body.medicationId && body.scheduledAt) {
      await scheduler.acknowledge(body.medicationId, new Date(body.scheduledAt));
    }
    return res.status(StatusCodes.OK).json(created);
  };

  undoConfirmation = async (req: Request, res: Response) => {
    this.logger.debug('undoConfirmation request');
    const { eventId, medicationId, scheduledAt } = req.body || {};
    const query: any = eventId ? { _id: eventId } : { medicationId, scheduledAt };
    if (!query._id && (!query.medicationId || !query.scheduledAt)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'eventId or medicationId+scheduledAt required' });
    }
    query.type = 'taken';
    const event = await AdherenceEventModel.findOne(query).exec();
    if (!event) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'No taken event found to undo' });
    }
    await AdherenceEventModel.deleteOne({ _id: event._id }).exec();
    const scheduler = DIContainer.get(ReminderScheduler);
    await scheduler.resetToPending(event.medicationId, event.scheduledAt);
    return res.status(StatusCodes.OK).json({ undone: true, eventId: event._id });
  };

  postponeReminder = async (req: Request, res: Response) => {
    this.logger.debug('postponeReminder request');
    const body = req.body || {};
    if (!body.medicationId || !body.scheduledAt) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'medicationId and scheduledAt are required' });
    }
    const med = await MedicationModel.findById(body.medicationId).lean().exec();
    const userId = med?.userId;
    const scheduledAt = new Date(body.scheduledAt);
    const postponeMinutes = Number(body.postponeMinutes || 5);

    // record postpone event
    const created = await new AdherenceEventModel({
      userId,
      medicationId: body.medicationId,
      scheduledAt,
      type: 'postponed',
      postponeMinutes
    }).save();

    // compute cumulative postpone for this dose
    const events = await AdherenceEventModel.find({ medicationId: body.medicationId, scheduledAt, type: 'postponed' }).lean().exec();
    const totalPostpone = events.reduce((sum, e: any) => sum + (e.postponeMinutes || 0), 0);
    const maxPostpone = med?.limits?.maxPostponeMinutes ?? 30;
    if (totalPostpone > maxPostpone) {
      await new AdherenceEventModel({
        userId,
        medicationId: body.medicationId,
        scheduledAt,
        type: 'alert',
        alertReason: 'thresholdExceeded'
      }).save();
      return res.status(StatusCodes.OK).json({ ...created.toObject(), alert: { active: true, reason: 'thresholdExceeded' } });
    }
    return res.status(StatusCodes.OK).json(created);
  };

  // TODO(integration): For confirm/taken and general status computation,
  // add a read endpoint to aggregate latest events per dose and return status/postponedUntil/alert.
  // This enables the frontend to consume a single payload without manual joins.

  // helpers
  private async fetchEventsByUser(userId?: string) {
    let events: any[];
    if (!userId) {
      events = await this.getAll({} as any, {} as any);
    } else {
      const meds = await MedicationModel.find({ userId }).select('_id').lean().exec();
      const ids = meds.map(m => String(m._id));
      events = await AdherenceEventModel.find({ medicationId: { $in: ids } }).lean().exec();
    }
    return { events };
  }
}
