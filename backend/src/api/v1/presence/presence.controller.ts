import { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Logger } from '../../shared/utils/logger';
import { PersonaModel } from '../personas/persona.model';
import { MedicationModel } from '../medications/medication.model';

let presenceState = {
  present: false,
  distanceMeters: null as number | null,
  device: null as string | null,
  lastSeen: null as Date | null,
  posture: null as string | null,
  brightnessHint: null as number | null,
  contrastHint: null as number | null,
  viewMode: 'general' as 'general' | 'detailed',
  persona: null as any,
  meds: [] as any[]
};

export class PresenceController {
  private logger: Logger = new Logger();

  public applyRoutes(): Router {
    const router = Router();
    router
      .get('/', this.getPresence)
      .post('/', this.updatePresence);
    return router;
  }

  getPresence = async (_req: Request, res: Response) => {
    return res.status(StatusCodes.OK).json({ ...presenceState });
  };

  updatePresence = async (req: Request, res: Response) => {
    const device = req.body?.device ?? null;
    const distanceMeters = req.body?.distanceMeters ?? null;
    const present = !!req.body?.present;
    const personaId = req.body?.personaId as string | undefined; // optional explicit persona mapping
    const NEAR_THRESHOLD = 1.5; // meters for detailed mode on wall display

    let persona: any = null;
    let meds: any[] = [];
    let viewMode: 'general' | 'detailed' = 'general';

    if (present && device === 'wall-display' && distanceMeters !== null && distanceMeters <= NEAR_THRESHOLD) {
      // if personaId provided (e.g., from face recognition), fetch persona and meds
      if (personaId) {
        persona = await PersonaModel.findById(personaId).lean().exec();
        if (persona) {
          const medDocs = await MedicationModel.find({ userId: String(persona._id) }).lean().exec();
          meds = medDocs.map(m => ({ name: m.name, dosage: m.dosage, times: m.times }));
          viewMode = 'detailed';
        }
      }
    }

    presenceState = {
      present,
      distanceMeters,
      device,
      lastSeen: new Date(),
      posture: req.body?.posture ?? null, // standing/sitting/lying
      brightnessHint: req.body?.brightnessHint ?? null,
      contrastHint: req.body?.contrastHint ?? null,
      viewMode,
      persona,
      meds
    };
    this.logger.debug('Presence updated', presenceState);
    return res.status(StatusCodes.OK).json({ ...presenceState });
  };
}
