const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../config/keys");
const passport = require("passport");
const { otplibAuthenticator } = require("../config/otplib");
const { mailgunHelper } = require("../config/mailgun");



// Load input validation
const validateRegisterInput = require("../validation/register");
const validateLoginInput = require("../validation/login");

exports.register = (req, res) => {
  const MAILGUN_DOMAIN_NAME = "sandbox7a491ac275e54d5c9cd95f463fcd2754.mailgun.org"
  const { firstName, lastName, email, password } = req.body;
  const otp = otplibAuthenticator.generate(email);
  console.log("[OTP]:", otp)
  const mailData = {
    from: MAILGUN_DOMAIN_NAME,
    to: email,
    subject: `Your OTP is ${otp}`,
    text: `Your OTP for MERN Authentication is ${otp}`
  };

  mailgunHelper.messages().send(mailData).then(res => console.log(res)).catch(err=>console.log(err));

  User.findOne({ email }).then(user => {
    if (user) {
      return res.status(400).json({ email: "Email already exists" });
    } else {
      const newUser = new User({
        name: `${firstName} ${lastName}`,
        email,
        password
      });

      // Hash password before saving in database
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          newUser
            .save()
            .then(user => {
              const payload = {
                id: user.id,
                name: user.name
              };

              jwt.sign(
                payload,
                keys.secretOrKey,
                {
                  expiresIn: '5 days' // 1 year in seconds
                },
                (err, token) => {
                  return res.json({
                    success: true,
                    accessToken: "Bearer " + token,
                    user
                  });
                }
              );
            })
            .catch(err => console.log(err));
        });
      });
    }
  });
}

exports.login = (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  User.findOne({ email }).then(user => {
    // Check if user exists
    if (!user) {
      return res.status(404).json({ error: "Email not found" });
    }

    // Check password
    bcrypt.compare(password, user.password).then(isMatch => {
      if (isMatch) {
        // User matched
        // Create JWT Payload
        const payload = {
          id: user.id,
          name: user.name
        };
        // Sign token
        jwt.sign(
          payload,
          keys.secretOrKey,
          {
            expiresIn: '5 days' // 1 year in seconds
          },
          (err, token) => {
            res.json({
              success: true,
              accessToken: "Bearer " + token,
              user
            });
          }
        );
      } else {
        return res
          .status(400)
          .json({ error: "Password incorrect" });
      }
    });
  });
}