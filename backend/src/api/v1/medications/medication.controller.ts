import { Request, Response, Router } from 'express';
import { ResourceController } from '../../shared';
import { StatusCodes } from 'http-status-codes';
import { MedicationModel, IMedication } from './medication.model';
import { Logger } from '../../shared/utils/logger';

export class MedicationController extends ResourceController<IMedication> {
  private logger: Logger = new Logger();

  constructor() {
    super(MedicationModel);
  }

  public applyRoutes(): Router {
    const router = Router();
    router
      .get('/', this.getMedications)
      .get('/:id', this.getMedicationById)
      .post('/', this.postMedication)
      .put('/:id', this.updateMedication)
      .delete('/:id', this.deleteMedication);
    return router;
  }

  getMedications = async (req: Request, res: Response) => {
    this.logger.debug('getMedications request');
    const data = await this.getAll(req, res);
    return res.status(StatusCodes.OK).json(data);
  };

  getMedicationById = async (req: Request, res: Response) => {
    this.logger.debug('getMedicationById request');
    const data = await this.getOne(req.params.id, req, res);
    return res.status(StatusCodes.OK).json(data);
  };

  postMedication = async (req: Request, res: Response) => {
    this.logger.debug('postMedication request');
    const created = await this.create(req, res);
    return res.status(StatusCodes.OK).json(created);
  };

  updateMedication = async (req: Request, res: Response) => {
    this.logger.debug('updateMedication request');
    const updated = await this.update(req.params.id, req.body.blacklist, req, res);
    return res.status(StatusCodes.OK).json(updated);
  };

  deleteMedication = async (req: Request, res: Response) => {
    this.logger.debug('deleteMedication request');
    const deleted = await this.delete(req.params.id, req, res);
    return res.status(StatusCodes.OK).json(deleted);
  };
}
