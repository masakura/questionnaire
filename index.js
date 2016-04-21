const fs = require('fs');
const twilio = require('twilio');
const config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));
const TwilioServer = require('twilio-server');
const server = new TwilioServer(config.twilio);
const Client = require('node-rest-client').Client;
const client = new Client();
const prefectures = JSON.parse(fs.readFileSync('./prefectures.json', 'utf-8'));

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
  const anq = {};
  const value = {};

  promise
    .then(server.twiml(result => {
      anq.phoneNumber = result.From;

      const resp = new twilio.TwimlResponse();
      resp.say('こんにちわ! お住まいの地方はどちらですか?', { language: 'ja-JP' });
      resp.gather({
        numDigits: 1,
      }, function () {
        this.say('北海道・東北地方は 1 を、' +
                 '関東地方は 2 を、' +
                 '中部地方は 3 を、' +
                 '関西地方は 4 を、' +
                 '中国地方は 5 を、' +
                 '四国地方は 6 を、' +
                 '九州・沖縄地方は 7 を押してください', {
                   language: 'ja-JP',
                 });
      });
      return resp.toString();
    }))
    .then(server.twiml(result => {
      console.log(result.Digits);

      value.area = result.Digits;

      const resp = new twilio.TwimlResponse();
      resp.gather({
        numDigits: 1,
      }, function () {
        const text = prefectures
                .filter(pref => pref.area === value.area)
                .map(pref => `${pref.name}は ${pref.number} を、`)
                .join('');
        this.say(`${text}押してください`, { language: 'ja-JP' });
      });
      return resp.toString();
    }))
    .then(server.twiml(result => {
      console.log(result.Digits);

      const select = prefectures
              .filter(pref => pref.area === value.area && pref.number === result.Digits);

      anq.prefecture = select[0].code;

      const resp = new twilio.TwimlResponse();
      resp.say('性別を教えてください', { language: 'ja-JP' });
      resp.gather({
        numDigits: 1,
      }, function () {
        this.say('男性の方は 1 を、' +
                 '女性の方は 2 を、' +
                 '不明な方は 3 を、' +
                 '押してください', { language: 'ja-JP' });
      });
      return resp.toString();
    }))
    .then(server.twiml(result => {
      console.log(result.Digits);

      switch (result.Digits) {
      case '1':
        anq.sex = '男性';
        break;

      case '2':
        anq.sex = '女性';
        break;

      default:
        anq.sex = '不明';
        break;
      }

      const resp = new twilio.TwimlResponse();
      resp.say('今回のハンズオンは勉強になりましたか?', { language: 'ja-JP' });
      resp.gather({
        numDigits: 1,
      }, function () {
        this.say('勉強になったという方は 1 を、' +
                 'そうでもないという方は 2 を、' +
                 '押してください', { language: 'ja-JP' });
      });
      return resp.toString();
    }))
    .then(server.twiml(result => {
      console.log(result.Digits);

      anq.isInteresting = result.Digits === '1';
      register(anq);

      const resp = new twilio.TwimlResponse();
      resp.say('ご協力ありがとうございました', { language: 'ja-JP' });
      resp.hangup();
      return resp.toString();
    }));
});
