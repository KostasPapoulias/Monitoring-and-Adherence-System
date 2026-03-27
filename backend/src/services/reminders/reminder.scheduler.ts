import { Logger } from '../../api/shared/utils/logger';
import { MedicationModel } from '../../api/v1/medications/medication.model';
import { PersonaModel } from '../../api/v1/personas/persona.model';
import { ReminderJobModel } from '../../api/v1/reminders/reminder-job.model';
import { SocketsService } from '../sockets';
import { PresenceController } from '../../api/v1/presence/presence.controller';

export class ReminderScheduler {
  private logger: Logger = new Logger();

  constructor(private sockets: SocketsService) {}

  /**
   * Generate reminder jobs for today based on medications and personas.
   * This is a simple, non-recurring generator intended for demo purposes.
   */
  public async generateToday() {
    const personas = await PersonaModel.find({}).lean().exec();
    for (const persona of personas) {
      const meds = await MedicationModel.find({ userId: String(persona._id) }).lean().exec();
      for (const med of meds) {
        const times = med.times || [];
        for (const t of times) {
          const scheduledAt = this.toTodayDate(t);
          await ReminderJobModel.updateOne(
            { medicationId: String(med._id), scheduledAt },
            {
              medicationId: String(med._id),
              userId: String(persona._id),
              scheduledAt,
              status: 'pending',
              channels: persona.devicePrefs?.modalities || { audio: true, visual: true, haptic: false },
              deviceHint: persona.devicePrefs?.primaryDevice
            },
            { upsert: true }
          ).exec();
        }
      }
    }
    this.logger.success('Reminder jobs generated for today');
  }

  /**
   * Emit due reminders (scheduledAt <= now and pending) and mark as sent.
   * This relies on being called periodically.
   */
  public async dispatchDue() {
    const now = new Date();
    const due = await ReminderJobModel.find({ status: 'pending', scheduledAt: { $lte: now } }).lean().exec();
    for (const job of due) {
      this.sockets.publish('reminder:due', {
        jobId: job._id,
        medicationId: job.medicationId,
        userId: job.userId,
        scheduledAt: job.scheduledAt,
        channels: job.channels,
        deviceHint: job.deviceHint
      });
      await ReminderJobModel.updateOne({ _id: job._id }, { status: 'sent', sentAt: new Date() }).exec();
    }
    if (due.length) this.logger.debug(`Dispatched ${due.length} reminders`);
  }

  /**
   * Mark a reminder as acknowledged when an adherence confirmation arrives.
   */
  public async acknowledge(medicationId: string, scheduledAt: Date) {
    await ReminderJobModel.updateOne({ medicationId, scheduledAt }, { status: 'acknowledged' }).exec();
  }

  /**
   * Reset a reminder back to pending (used when a confirmation is undone).
   */
  public async resetToPending(medicationId: string, scheduledAt: Date) {
    await ReminderJobModel.updateOne({ medicationId, scheduledAt }, { status: 'pending', sentAt: null }).exec();
  }

  private toTodayDate(timeHHMM: string): Date {
    const [h, m] = timeHHMM.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  }
}
