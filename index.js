const fs = require('fs');
const twilio = require('twilio');
const config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));
const TwilioServer = require('twilio-server');
const server = new TwilioServer(config.twilio);
const Client = require('node-rest-client').Client;
const client = new Client();

function register(result) {
  const isInteresting = result.isInteresting ? ['面白かったですか?'] : [];

  const data = {
    app: 18,
    record: {
      PhoneNumber: {
        value: result.phoneNumber,
      },
      Sex: {
        value: result.sex,
      },
      Prefecture: {
        value: result.prefecture,
      },
      IsInteresting: {
        value: isInteresting,
      },
    },
  };

  client.post(config.kintone.url, {
    data,
    headers: {
      'Content-Type': 'application/json',
      'X-Cybozu-Authorization': config.kintone.authorization,
    },
  }, body => {
    console.log(body);
  });
}

/*
register({
  phoneNumber: '00011122233',
  sex: '不明',
  prefecture: 20,
  isInteresting: true,
});
*/

server.start();

server.receive(promise => {
  promise
    .then(server.twiml(() => {
      const resp = new twilio.TwimlResponse();
      resp.say('こんにちわ!', { language: 'ja-JP' });
      return resp.toString();
    }));
});
