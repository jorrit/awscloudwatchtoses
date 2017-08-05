const AWS = require('aws-sdk');
const zlib = require('zlib');
const Promise = require('bluebird');

const ses = new AWS.SES({ apiVersion: '2010-12-01' });
const sendEmail = Promise.promisify(ses.sendEmail.bind(ses));
const mailFrom = process.env.MAIL_FROM || 'someone@example.com';
const mailTo = process.env.MAIL_TO || 'someone@example.com';
const appName = process.env.APP_NAME || 'SomeApp';

const gunzip = Promise.promisify(zlib.gunzip);

exports.handler = function (event, context) {
  const payload = new Buffer(event.awslogs.data, 'base64');

  gunzip(payload)
    .then(result => {
      const result_text = result.toString('ascii');
      const result_parsed = JSON.parse(result_text);

      let lastTimestamp = 0;
      let eventCount = 0;
      let message = result_parsed.logEvents.reduce((acc, event) => {
        let result = acc;

        if ((event.timestamp - lastTimestamp) >= 10) {
          lastTimestamp = event.timestamp;
          if (result.length > 0) {
            result += '\n\n';
          }
          result += `Date: ${new Date(event.timestamp).toISOString()}\n`;
          ++eventCount;
        }
        result += event.message;
        result += '\n';

        return result;
      }, '');

      message += `\n\nLog group: ${result_parsed.logGroup}\n`;
      message += `Log stream: ${result_parsed.logStream}\n`;

      const params = {
        Destination: {
          ToAddresses: [mailTo]
        },
        Message: {
          Body: {
            Text: {
              Charset: 'UTF-8',
              Data: message,
            },
          },
          Subject: {
            Charset: 'UTF-8',
            Data: `[${appName}] ${eventCount} new log events`,
          }
        },
        Source: mailFrom,
        Tags: [{
          Name: 'Type',
          Value: 'ErrorMail',
        }],
      };
      return sendEmail(params);
    })
    .then(() => {
      context.done();
    })
    .catch(err => {
      context.fail(err);
    });
};
