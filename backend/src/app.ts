import http from 'http';
import cors from 'cors';
import express from 'express';
import bodyParser from 'body-parser';
import { MethodNotAllowed } from 'http-errors';
import { StatusCodes } from 'http-status-codes';
import { Api } from './api';
import { PrismaAdapter } from './database/prisma/prisma.adapter';
import { config, getHostDomain } from './config/environment-railway';
import { DIContainer, SocketsService, ReminderScheduler } from './services';
import { Logger } from './api/shared/utils/logger';
export class App {
    private logger: Logger = new Logger();
    private app!: express.Application;

    constructor() { }

    /**
     * Initializes application and starts the server
     */
    public async start() {
        try {
            // Setup and connect database
            await this.setupDatabase();

            // Setup express and API routes
            this.app = await this.setupExpressApp();
            const server = http.createServer(this.app);

            // Start socket server
            const socketService = DIContainer.get(SocketsService);
            await socketService.start(server);

            // Start reminder scheduler (generate today's jobs and dispatch loop)
            const scheduler = DIContainer.get(ReminderScheduler);
            await scheduler.generateToday();
            // poll every 30 seconds for due reminders
            setInterval(() => scheduler.dispatchDue(), 30_000);

            // Finally start server
            server.listen(config.port, () => {
                this.logger.success(`Server started in "${config.environment}" mode. Available on: ${getHostDomain()}`);
            });

        } catch (e) {
            this.logger.error(`Failed to start server due to error: `, e);
            process.exit(-1);
        }
    }

    // #region Private methods

    /**
     * Setup express application
     *
     * @private
     * @returns {Promise<express.Application>}
     */
    private async setupExpressApp(): Promise<express.Application> {
        const application = express();
        application
            .set('port', config.port)
            .set('env', config.environment)
            .use(cors())
            .use(bodyParser.json({ limit: '5MB' }))
            .use(bodyParser.urlencoded({ extended: true }));

        // setup primary app routes.
        application
            .use(await Api.applyRoutes(application));

        // all other routes should return 405 error (Method Not Allowed)
        application
            .route('/*')
            .get((req, res) => { throw new MethodNotAllowed(); });

        // global error handler
        // !it has to be the last
        application.use(this.handlerError);

        return application;
    }

    /**
     * Setup and connect to database
     *
     * @private
     */
    private async setupDatabase() {
        try {
            // Connect to Postgres database via Prisma
            await PrismaAdapter.connect();
            this.logger.success(`Postgres database connected successfully`);
        } catch (e) {
            this.logger.error(`Database connection error: `, e);
            throw e;
        }
    }

    /**
     * Middleware for handling errors
     *
     * @private
     * @param {*} error
     * @param {express.Request} req
     * @param {express.Response} res
     * @param {express.NextFunction} next
     */
    private handlerError(error: any, req: express.Request, res: express.Response, next: express.NextFunction) {
        let status = error.status || StatusCodes.INTERNAL_SERVER_ERROR;
        const code = error.code || error.name || 'InternalServerError';
        const message = error.message || 'Internal Server Error';
        const errors = error.errors || undefined;

        res.status(status).json({ status, code, message, errors });
    }

    // #endregion Private methods
    // ---------------------------------------

}
