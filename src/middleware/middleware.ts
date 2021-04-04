import { Request, Response, NextFunction } from 'express';
import { plainToClass } from 'class-transformer';
import * as classValidator from 'class-validator';
import httpStatus = require('http-status');
import { getTimebox } from '../services/timebox';

export const isLogged = (req: Request, res: Response, next: NextFunction) => {
    return next();
};

export function validateMiddleware(type: any, where: 'body' | 'query' | 'params' = 'body') {
    return async (req: Request, res: Response, next: NextFunction) => {
        const parsedBody = plainToClass(type, req[where]);
        const errors = await classValidator.validate(parsedBody);
        if (errors.length !== 0) {
            const message = errors.join('');
            console.log('Validation error: ', message);
            return res.status(httpStatus.BAD_REQUEST).send(message);
        }
        req.body = parsedBody;
        return next();
    };
}

export function withTimebox(where: 'body' | 'query' | 'params' = 'body') {
    return async (req: Request, res: Response, next: NextFunction) => {
        const { mac } = req[where];
        if (!mac || typeof mac !== 'string') {
            return res.status(httpStatus.BAD_REQUEST).send(`mac address not found in ${where} parameter`);
        }
        try {
            req.timebox = await getTimebox(mac);
        } catch (e) {
            console.error(e);
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).send(e);
        }

        return next();
    }
}