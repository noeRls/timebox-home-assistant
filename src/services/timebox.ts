import { BluetoothSerialPort } from 'bluetooth-serial-port';

const bt = new BluetoothSerialPort();

// TODO handle multiple connection
export class Timebox {
    mac: string
    incomingData: Buffer[]

    constructor(mac: string) {
        this.mac = mac;
        this.incomingData = [];
    }

    connect = async (): Promise<void> => {
        let first = true;
        return new Promise((res, rej) => {
            bt.findSerialPortChannel(this.mac, (port) => {
                bt.connect(this.mac, port, () => {
                    bt.on('data', (buffer: Buffer) => {
                        if (first) {
                            first = false;
                            res();
                        }
                    });
                    bt.on('data', this.onData);
                }, rej);
            }, () => rej(`can not connect to ${this.mac}`));
        })
    }

    sendMultiple = async (buffers: Buffer[]): Promise<void> => {
        for (let buffer of buffers) {
            console.log(`-> ${buffer}`);
            await this.send(buffer);
        }
    }

    send = async (buffer: Buffer): Promise<void> => {
        return new Promise((res, rej) => {
            bt.write(buffer, (err) => {
                if (err) {
                    console.error('error while sending bytes', err)
                    rej(err);
                    return;
                }
                res();
            });
        });
    };

    onData = (buffer: Buffer) => {
        console.log(`<- ${buffer}`);
        this.incomingData.push(buffer);
    }

    disconnect = async () => {
        // TODO
    }
}

const timeboxStore: Record<string, Timebox> = {}

export const getTimebox = async (mac: string): Promise<Timebox> => {
    if (timeboxStore[mac]) {
        console.log(`Using existing connection to ${timeboxStore[mac].mac}`);
        return timeboxStore[mac];
    }
    const t = new Timebox(mac);
    await t.connect();
    timeboxStore[mac] = t;
    console.log(`Connected to ${t.mac}`);
    return t;
}

const removeTimebox = (t: Timebox): void => {
    timeboxStore[t.mac] = undefined;
    t.disconnect();
}