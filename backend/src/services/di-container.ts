import "reflect-metadata";
import { Container } from 'inversify';
import { SocketsService } from './sockets';
import { ReminderScheduler } from './reminders/reminder.scheduler';

const DIContainer = new Container();


// Register sockets service
DIContainer
  .bind<SocketsService>(SocketsService)
  .toConstantValue(new SocketsService());

// Register reminder scheduler (depends on sockets)
DIContainer
  .bind<ReminderScheduler>(ReminderScheduler)
  .toConstantValue(new ReminderScheduler(DIContainer.get(SocketsService)));

export { DIContainer };
