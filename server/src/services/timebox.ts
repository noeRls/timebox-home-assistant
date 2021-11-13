import { BluetoothSerialPort } from 'bluetooth-serial-port';

// TODO handle multiple connection
export class Timebox {
    mac: string
    incomingData: Buffer[]
    bt: BluetoothSerialPort

    constructor(mac: string) {
        this.bt = new BluetoothSerialPort();
        this.mac = mac;
        this.incomingData = [];
    }

    connect = async (): Promise<void> => {
        return new Promise((res, rej) => {
            this.bt.findSerialPortChannel(this.mac, (port) => {
                this.bt.connect(this.mac, port, () => {
                    this.bt.on('data', this.onData);
                    this.bt.on('closed', this.disconnect);
                    this.bt.on('failure', this.disconnect);

                    res();
                }, rej);
            }, () => rej(`can not connect to ${this.mac}`));
        })
    }

    sendMultiple = async (buffers: Buffer[]): Promise<void> => {
        for (let buffer of buffers) {
            console.log(`-> sending data`);
            await this.send(buffer);
        }
    }

    send = async (buffer: Buffer): Promise<void> => {
        return new Promise((res, rej) => {
            this.bt.write(buffer, (err) => {
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
        console.log(`<- receiving data`);
        this.incomingData.push(buffer);
    }

    disconnect = async () => {
        if (this.bt.isOpen()) {
            this.bt.close();
        }
        timeboxStore[this.mac] = undefined;
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