import { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ResourceController } from '../../shared';
import { IPersona, PersonaModel } from './persona.model';
import { Logger } from '../../shared/utils/logger';

export class PersonaController extends ResourceController<IPersona> {
  private logger: Logger = new Logger();
  constructor() { super(PersonaModel); }

  public applyRoutes(): Router {
    const router = Router();
    router
      .get('/', this.getAllPersonas)
      .get('/:id', this.getPersonaById)
      .post('/', this.postPersona)
      .put('/:id', this.updatePersona)
      .delete('/:id', this.deletePersona);
    return router;
  }

  getAllPersonas = async (req: Request, res: Response) => {
    this.logger.debug('getAllPersonas request');
    const data = await this.getAll(req, res);
    return res.status(StatusCodes.OK).json(data);
  };

  getPersonaById = async (req: Request, res: Response) => {
    this.logger.debug('getPersonaById request');
    const data = await this.getOne(req.params.id, req, res);
    return res.status(StatusCodes.OK).json(data);
  };

  postPersona = async (req: Request, res: Response) => {
    this.logger.debug('postPersona request');
    const created = await this.create(req, res);
    return res.status(StatusCodes.OK).json(created);
  };

  updatePersona = async (req: Request, res: Response) => {
    this.logger.debug('updatePersona request');
    const updated = await this.update(req.params.id, req.body.blacklist, req, res);
    return res.status(StatusCodes.OK).json(updated);
  };

  deletePersona = async (req: Request, res: Response) => {
    this.logger.debug('deletePersona request');
    const deleted = await this.delete(req.params.id, req, res);
    return res.status(StatusCodes.OK).json(deleted);
  };
}
