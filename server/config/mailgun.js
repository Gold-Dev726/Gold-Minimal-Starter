const mailgun = require("mailgun-js");

const MAILGUN_API_KEY = "73a731aa79d3ad85098fa8015578fedc-9776af14-cb834290"
const MAILGUN_DOMAIN_NAME = "sandbox7a491ac275e54d5c9cd95f463fcd2754.mailgun.org"

const mailgunHelper = mailgun({
  apiKey: MAILGUN_API_KEY,
  domain: MAILGUN_DOMAIN_NAME
});

module.exports = { mailgunHelper };
