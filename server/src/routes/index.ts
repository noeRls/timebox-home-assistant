  
import { Express } from "express";
import timebox from './timebox';

export default (app: Express) => {
    app.use(timebox);
};