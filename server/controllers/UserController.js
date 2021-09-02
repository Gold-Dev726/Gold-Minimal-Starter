const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../config/keys");
const passport = require("passport");
const nodemailer = require("nodemailer");

const { otplibAuthenticator } = require("../config/otplib");
const { mailgunHelper } = require("../config/mailgun");

const nodemailTransporter = nodemailer.createTransport({
  // host: "smtp.gmail.com",
  // port: 465,
  // secure: false,
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // true for 587, false for other ports
  // requireTLS: true,
  // service: 'gmail',
  auth: {
    user: keys.mailUser,
    pass: keys.mailPass
  },
  tls: {rejectUnauthorized: false}
})


nodemailTransporter.verify(function(error, success) {
  if (error) {
    console.log(error);
  } else {
    console.log("Server is ready to take our messages!");
  }
});

// Load input validation
const validateRegisterInput = require("../validation/register");
const validateLoginInput = require("../validation/login");

exports.register = (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  const otp = otplibAuthenticator.generate(email);
  console.log("[OTP]:", otp)
  const mailData = {
    from: "no-reply@gearmobile.com",
    to: email,
    subject: `Your OTP is ${otp}`,
    text: `Your OTP for MERN Authentication is ${otp}`
  };

  mailgunHelper.messages().send(mailData).then(res => console.log(res)).catch(err=>console.log(err));


  const mail = {
    from: 'goldendev726@gmail.com',
    to: 'simba990724@gmail.com',
    message: 'Sending Email using Node.js',
    text: 'That was easy!'
  }

  nodemailTransporter.sendMail(mail, (err, data) => {
    if (err) {
      console.log(err)
    } else {
      console.log("Email sent!")
    }
  })
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