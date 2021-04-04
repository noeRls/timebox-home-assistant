
import * as express from 'express';
import routes from './routes';
import { corsMiddleware } from './middleware';
import * as logger from 'morgan';
import { config as dotenv }from 'dotenv';
dotenv();

const start = async () => {
    const app = express();

    app.use(corsMiddleware);
    app.use(logger('dev'));
    app.use(express.static('public'));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    routes(app);
    app.get('/hello', (_, res) => res.status(200).send('Hello World !'));

    app.listen(process.env.PORT, () => console.log(`Server listening on port ${process.env.PORT}...`));
};

start().catch(console.error);