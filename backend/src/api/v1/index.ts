import * as express from 'express';
import { ExampleController } from './example/example.controller';
import { ItemShopController } from './item-shop/item-shop.controller';
import { TaskController } from './task/task.controller';
import { MedicationController } from './medications/medication.controller';
import { AdherenceController } from './adherence/adherence.controller';
import { AlertsController } from './alerts/alerts.controller';
import { PresenceController } from './presence/presence.controller';
import { PersonaController } from './personas/persona.controller';
const apiV1Router = express.Router();


apiV1Router
  // Example routes
  .use(
    '/example',
    new ExampleController().applyRoutes()
  )
  .use(
    '/item-shop',
    new ItemShopController().applyRoutes()
  )
  .use(
    '/tasks',
    new TaskController().applyRoutes()
  );
apiV1Router
  .use(
    '/medications',
    new MedicationController().applyRoutes()
  )
  .use(
    '/adherence',
    new AdherenceController().applyRoutes()
  )
  .use(
    '/alerts',
    new AlertsController().applyRoutes()
  )
  .use(
    '/presence',
    new PresenceController().applyRoutes()
  )
  .use(
    '/personas',
    new PersonaController().applyRoutes()
  );


export { apiV1Router };

