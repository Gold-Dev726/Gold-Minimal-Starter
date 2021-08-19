const otplib = require("otplib");

otplib.authenticator.options = {
  step: 600,
  window: 2,
  digits: 6
};

const otplibAuthenticator = otplib.authenticator;

module.exports = { otplibAuthenticator };
