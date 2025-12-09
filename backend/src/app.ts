import http from 'http';
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import { MethodNotAllowed } from 'http-errors';
import { StatusCodes } from 'http-status-codes';
import { Api } from './api';
import { MongoAdapter } from './database';
import { config, getHostDomain } from './config/environment';
import { DIContainer, SocketsService, ReminderScheduler } from './services';
import { Logger } from './api/shared/utils/logger';
import { PersonaModel } from './api/v1/personas/persona.model';
import { MedicationModel } from './api/v1/medications/medication.model';
import { AdherenceEventModel } from './api/v1/adherence/adherence-event.model';
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
            // connect to database
            await MongoAdapter.connect();
            this.logger.success(`MongoDB is connected on ${config.mongo.uri}`);
            const Str = mongoose.Schema.Types.String as any;
            Str.checkRequired((v: string) => v != null);

            // Auto-seed database with sample data if empty
            await this.autoSeedIfEmpty();

        } catch (e) {
            this.logger.error(`MongoDB connection error: `, e);
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

        // cast mongoose errors to bad request
        if (error instanceof mongoose.Error.CastError
            || error instanceof mongoose.Error.ValidationError) {
            status = StatusCodes.UNPROCESSABLE_ENTITY;
        }

        res.status(status).json({ status, code, message, errors });
    }

    // #endregion Private methods
    // ---------------------------------------

    private async autoSeedIfEmpty() {
        try {
            const count = await PersonaModel.countDocuments({}).exec();
            if (count > 0) { return; }
            this.logger.debug('No personas found. Seeding initial data...');

            const personas: any[] = [
                {
                    name: 'Eleni Papadaki', age: 76, occupation: 'Retired primary school teacher',
                    livingSituation: 'Lives alone in Heraklion, Greece; her children live in Athens.',
                    healthProfile: 'Chronic heart failure and hypertension. Takes five pills daily. Mild short-term memory issues.',
                    technologyProfile: 'Basic smartphone user; relies on wall-mounted smart display. Prefers large text, high contrast, voice or touch.',
                    behavioralTraits: 'Routine-driven; appreciates calm reminders; anxious if devices behave unpredictably.',
                    devicePrefs: { primaryDevice: 'wall-display', modalities: { audio: true, visual: true, haptic: false }, ui: { textSize: 'large', contrast: 'high', cognitiveMode: 'simplified' } }
                },
                {
                    name: 'Maria Kostaki', age: 42, occupation: 'Accountant',
                    livingSituation: 'Married, mother of three (ages 5, 9, and 13).',
                    healthProfile: 'Iron supplements and vitamin D; occasional antibiotics for sinus infections.',
                    technologyProfile: 'Highly familiar with smartphone apps. Prefers visual dashboards and push notifications.',
                    behavioralTraits: 'Multitasks; tends to forget medication; wants low-effort systems.',
                    devicePrefs: { primaryDevice: 'smartphone', modalities: { audio: true, visual: true, haptic: true }, ui: { textSize: 'medium', contrast: 'normal', cognitiveMode: 'standard' } }
                },
                {
                    name: 'Sofia Lianou', age: 9, occupation: 'Primary school student',
                    livingSituation: 'Lives with parents and older brother.',
                    healthProfile: '2-week antibiotics and syrup.',
                    technologyProfile: 'Loves using the smart speaker; limited reading skills; relies on audio feedback.',
                    behavioralTraits: 'Finds routines boring but loves praise; supervised by parents; encouraged independence.',
                    devicePrefs: { primaryDevice: 'smart-speaker', modalities: { audio: true, visual: false, haptic: false }, ui: { textSize: 'large', contrast: 'high', cognitiveMode: 'simplified' } }
                },
                {
                    name: 'Andreas Michas', age: 23, occupation: 'Junior software engineer',
                    livingSituation: 'Lives alone; commutes and travels for work.',
                    healthProfile: 'Asthma and seasonal allergies. Preventive inhaler and vitamin B complex.',
                    technologyProfile: 'Heavy smartwatch/smartphone user. Prefers haptic alerts and quick interactions.',
                    behavioralTraits: 'Tech-savvy but forgetful; tracks workouts and sleep; wants non-intrusive reminders.',
                    devicePrefs: { primaryDevice: 'smartwatch', modalities: { audio: false, visual: true, haptic: true }, ui: { textSize: 'small', contrast: 'normal', cognitiveMode: 'standard' } }
                }
            ];

            const medsByPersona: Record<string, any[]> = {
                'Eleni Papadaki': [
                    { name: 'ACE inhibitor', dosage: '10mg', frequency: 'daily', times: ['08:00'], sideEffects: ['dizziness'] },
                    { name: 'Beta blocker', dosage: '5mg', frequency: 'daily', times: ['20:00'], sideEffects: ['fatigue'] },
                ],
                'Maria Kostaki': [
                    { name: 'Iron supplement', dosage: '325mg', frequency: 'daily', times: ['09:00'] },
                    { name: 'Vitamin D', dosage: '2000 IU', frequency: 'daily', times: ['09:00'] },
                ],
                'Sofia Lianou': [
                    { name: 'Antibiotic', dosage: '250mg', frequency: 'twice daily', times: ['08:00','20:00'] },
                    { name: 'Syrup', dosage: '5ml', frequency: 'twice daily', times: ['08:00','20:00'] },
                ],
                'Andreas Michas': [
                    { name: 'Preventive inhaler', dosage: '2 puffs', frequency: 'daily', times: ['07:30'] },
                    { name: 'Vitamin B complex', dosage: '1 tab', frequency: 'daily', times: ['08:00'] },
                ]
            };

            for (const p of personas) {
                const personaDoc = await new PersonaModel(p).save();
                const medConfigs = medsByPersona[p.name] || [];
                const medDocs: any[] = [];
                for (const m of medConfigs) {
                    const med = await new MedicationModel({ ...m, userId: String(personaDoc._id) }).save();
                    medDocs.push(med);
                }
                // recent adherence (last 5 days) as taken
                for (const med of medDocs) {
                    for (let d = 1; d <= 5; d++) {
                        const when = new Date(Date.now() - d * 24 * 60 * 60 * 1000);
                        await new AdherenceEventModel({ medicationId: String(med._id), scheduledAt: when, confirmedAt: when, type: 'taken', method: 'touch', device: p.devicePrefs.primaryDevice, withinWindow: true }).save();
                    }
                }
            }
            this.logger.success('Initial seed completed');
        } catch (e) {
            this.logger.error('Auto-seed failed', e);
        }
    }


}
