import { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';

let presenceState = { present: false, distanceMeters: null as number | null, device: null as string | null };

export class PresenceController {
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
    presenceState = {
      present: !!req.body?.present,
      distanceMeters: req.body?.distanceMeters ?? null,
      device: req.body?.device ?? null
    };
    return res.status(StatusCodes.OK).json({ ...presenceState });
  };
}
