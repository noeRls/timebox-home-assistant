const TIMEBOX_ADDRESS = "11:75:58:F2:B2:2B";
var btSerial = new (require('bluetooth-serial-port')).BluetoothSerialPort();
var Divoom = require('node-divoom-timebox-evo');

let connected = false;

btSerial.findSerialPortChannel(TIMEBOX_ADDRESS, function (channel) {
  console.log(channel)
  btSerial.connect(TIMEBOX_ADDRESS, channel, function () {
    console.log('connected');
    btSerial.on('data', function (buffer) {
      console.log(`<- ${buffer.toString('hex')}`);
      if (!connected) {
        connected = true;
        var d = (new Divoom.TimeboxEvo()).createRequest('animation');
        d.read('skull.png').then(result => {
          result.asBinaryBuffer().forEach(elt => {
            console.log(`-> ${elt.toString('hex')}`)
            btSerial.write(elt,
              function (err, bytesWritten) {
                if (err) {
                  console.error(err);
                }
                console.log('bytes written', bytesWritten)
                console.log('TEST SUCCESS');
                process.exit(0);
              }
            );
          })
        }).catch(err => {
          throw err;
        });
      }
    });

  }, function () {
    console.log('cannot connect');
  });
}, function () {
  console.log('found nothing');
});

