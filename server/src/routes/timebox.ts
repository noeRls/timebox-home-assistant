import { Router, Request, Response } from 'express';
import { isLogged, validateMiddleware, withTimebox } from '../middleware';
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, OK } from 'http-status';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import * as multer from 'multer';
import { DisplayAnimation, DisplayText, TimeboxEvo } from 'node-divoom-timebox-evo';

const upload = multer({ dest: './images' });

const router = Router();

router.post('/image', isLogged, upload.single('image'), withTimebox(), async (req: Request, res: Response) => {
    if (!req.file || !['png', 'gif', 'jpg'].some(m => req.file.mimetype.includes(m))) {
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

class TextBody {
    @IsString()
    text: string
}

function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

router.post('/connect', isLogged, withTimebox(), (req, res) => res.status(OK).end());

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

export default router;