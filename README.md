# Send AWS CloudWatch logs to SES

## Uploading

1. Run `npm install`.
2. Zip node_modules and index.js.
3. Create a Lambda function with the zip file and make sure it has access to the SES SendEmail API. 
4. Set the `MAIL_FROM`, `MAIL_TO` and `APP_NAME` environment variables.
5. Configure your CloudWatch log to stream to your Lambda function.
