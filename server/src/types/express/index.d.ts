declare namespace Express {
    export interface Request {
        timebox: import("../../services/timebox").Timebox;
    }
}