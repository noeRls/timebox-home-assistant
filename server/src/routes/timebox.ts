import { Router, Request, Response } from 'express';
import { isLogged, validateMiddleware, withTimebox } from '../middleware';
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, OK } from 'http-status';
import { IsBoolean, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import * as multer from 'multer';
import { BrightnessCommand, DisplayAnimation, DisplayText, TimeboxEvo, TimeChannel, DateTimeCommand, TIMEBOX_CONST } from 'node-divoom-timebox-evo';

const upload = multer({ dest: './images' });

const router = Router();

router.post('/image', isLogged, upload.single('image'), withTimebox(), async (req: Request, res: Response) => {
    if (!req.file/* || !['png', 'gif', 'jpg'].some(m => req.file.mimetype.includes(m))*/) {
        return res.status(BAD_REQUEST).send({ error: 'Invalid file' });
    }
    try {
        const r = (new TimeboxEvo()).createRequest('animation') as DisplayAnimation;
        const data = await r.read(req.file.path)
        console.log('request created, sending...');
        await req.timebox.sendMultiple(data.asBinaryBuffer());
        return res.status(OK).end();
    } catch (e) {
        console.error(e);
        return res.status(INTERNAL_SERVER_ERROR).send(e);
    }
});

router.post('/connect', isLogged, withTimebox(), (req, res) => res.status(OK).end());

class TextBody {
    @IsString()
    text: string
}

function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

router.post('/text', isLogged, validateMiddleware(TextBody), withTimebox(), async (req, res) => {
    const { text } = req.body as TextBody;
    let replied = false;
    try {
        const r = (new TimeboxEvo()).createRequest('text') as DisplayText;
        r.text = text;
        await req.timebox.sendMultiple(r.messages.asBinaryBuffer());
        res.status(OK).end();
        replied = true;
        for (let i = 0; i < 512; i++) {
            await req.timebox.sendMultiple(r.getNextAnimationFrame().asBinaryBuffer());
            await sleep(1000 / 20); // 20 request per second
        }

    } catch (e) {
        console.error(e);
        if (!replied) {
            res.status(INTERNAL_SERVER_ERROR).send(e);
        }
    }
});

router.post('/time', isLogged, withTimebox(), async (req, res) => {
    try {
        const r = (new TimeboxEvo()).createRequest('time') as TimeChannel;

        if (!req.body.display_type || req.body.display_type == "fullscreen") {
            r.type = TIMEBOX_CONST.TimeType.FullScreen;
        } else if (req.body.display_type == "rainbow") {
            r.type = TIMEBOX_CONST.TimeType.Rainbow;
        } else if (req.body.display_type == "with-box") {
            r.type = TIMEBOX_CONST.TimeType.WithBox;
        } else if (req.body.display_type == "analog-square") {
            r.type = TIMEBOX_CONST.TimeType.AnalogSquare;
        } else if (req.body.display_type == "analog-round") {
            r.type = TIMEBOX_CONST.TimeType.AnalogRound;
        } else if (req.body.display_type == "fullscreen-negative") {
            r.type = TIMEBOX_CONST.TimeType.FullScreenNegative;
        } else {
            return res.status(BAD_REQUEST).send("Invalid time display type");
        }

        await req.timebox.sendMultiple(r.messages.asBinaryBuffer());

        const s = (new TimeboxEvo()).createRequest('raw');
        s.push("2D01");
        await req.timebox.sendMultiple(s.messages.asBinaryBuffer());

        return res.status(OK).end();
    } catch (e) {
        console.error(e);
        return res.status(INTERNAL_SERVER_ERROR).send(e);
    }
});

router.post('/datetime', isLogged, withTimebox(), async (req, res) => {
	const current_date = req.body.datetime ? new Date(req.body.datetime) : new Date();

    try {
        const r = (new TimeboxEvo()).createRequest('datetime') as DateTimeCommand;
        r.date = current_date;
        await req.timebox.sendMultiple(r.messages.asBinaryBuffer());
        return res.status(OK).end();
    } catch (e) {
        console.error(e);
        return res.status(INTERNAL_SERVER_ERROR).send(e);
    }
});

router.post('/brightness', isLogged, withTimebox(), async (req, res) => {
    const brightness = Number(req.body.brightness);
    if (brightness < 0 || brightness > 100) {
        return res.status(BAD_REQUEST).send('Invalid brigthness')
    }
    try {
        const r = (new TimeboxEvo()).createRequest('brightness') as BrightnessCommand;
        r.brightness = brightness;
        await req.timebox.sendMultiple(r.messages.asBinaryBuffer());
        return res.status(OK).end();
    } catch (e) {
        console.error(e);
        return res.status(INTERNAL_SERVER_ERROR).send(e);
    }
});

export default router;