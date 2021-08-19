const Token = require("../models/Token");
const Promotion = require("../models/Promotion");
const config = require('../config/keys');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../config/keys");
const passport = require("passport");
const path = require('path');
const multer = require("multer");
const nodemailer = require("nodemailer");
const userIP = require('user-ip');
const moment = require('moment');

const storage = multer.diskStorage({
  destination: "./public/uploads",
  filename: function (req, file, cb) {
    cb(null, "upload_" + file.fieldname + "_" + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg" || file.mimetype == "image/gif") {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error('Only .png, .jpg, .jpeg, .gif format allowed!'));
    }
  }
}).fields([{ name: 'upper' }, { name: "bottom" }]);

// const nodemailTransporter = nodemailer.createTransport({
//   // host: "smtp.gmail.com",
//   // port: 465,
//   // secure: false,
//   host: "smtp.gmail.com",
//   port: 465,
//   secure: true, // true for 587, false for other ports
//   // requireTLS: true,
//   // service: 'gmail',
//   auth: {
//     user: config.mailUser,
//     pass: config.mailPass
//   },
//   tls: {rejectUnauthorized: false}
// })


// nodemailTransporter.verify(function(error, success) {
//   if (error) {
//     console.log(error);
//   } else {
//     console.log("Server is ready to take our messages!");
//   }
// });

// Load input validation
const validateRegisterInput = require("../validation/register");
const validateLoginInput = require("../validation/login");

exports.submit = (req, res) => {
  const {
    name,
    symbol,
    description,
    logo,
    market_cap,
    launch_date,
    presale_date,
    address,
    website,
    telegram,
    twitter,
    chart,
    tags
  } = req.body;
  // // Form validation
  // const { errors, isValid } = validateRegisterInput(req.body);

  // // Check validation
  // if (!isValid) {
  //   console.log(errors)
  //   return res.status(400).json(errors);
  // }

  Token.findOne({ address }).then(token => {
    if (token) {
      res.status(400).json({ error: `${token.name}(${token.symbol}) token already exists` });
    } else {
      const newToken = new Token({
        name,
        symbol,
        description,
        logo,
        market_cap,
        launch_date,
        presale_date,
        address,
        website,
        telegram,
        twitter,
        chart,
        tags
      });

      newToken
        .save()
        .then(token => {
          res.json(token);
        })
        .catch(err => res.status(400).json({ error: 'Oops! An error occured when submitting your token. Please check required field' }));
    }
  });
}


exports.getTokens = (req, res) => {
  Token.find().then(tokens => {
    res.json(tokens);
  });
}

exports.getTokenById = (req, res) => {
  Token.findById(req.params.id).then(token => {
    res.json(token);
  });
}

exports.getApprovedTokens = (req, res) => {
  Token.find({ approved: true }).then(tokens => {
    res.json(tokens);
  });
}

exports.voteToken = async (req, res) => {
  try {
    const { token } = req.body;
    const ip = userIP(req);
    const currentTime = new Date();
    const newVote = {
      ip,
      count: 1,
      last_date: currentTime
    }

    const exist = await Token.findOne({ _id: token, 'votes.ip': ip })
    console.log(exist)
    if (exist) {
      const lastTime = exist.votes.find(vote => vote.ip === ip).last_date;
      const diff = moment(Date.now()).diff(lastTime);
      // const diffDays = moment(tokenInfo.launch_date).diff(Date.now(), 'days');
      const duration = moment.duration(diff);
      const differenceHours = duration.hours();
      if (differenceHours >= 12) {
        await Token.findOneAndUpdate({ _id: token, 'votes.ip': ip }, { $inc: { 'votes.$.count': 1 }, $set: {'votes.$.last_date': currentTime} })
      } else {
        return res.status(400).json({ error: `You already vote this token with this ${ip} IP. You can vote again after 12hrs. ${12 - differenceHours}hrs remaining.` })
      }
    } else {
      console.log(newVote)
      await Token.findByIdAndUpdate(token, { $push: { votes: newVote } })
    }
    // const tokens = await Token.find();
    console.log('IP------', ip)
    res.json({success: true})
    // res.json(tokens)
  } catch {
    res.status(400).json({ error: "Oops! An error occured" })
  }
}

exports.approveToken = async (req, res) => {
  try {
    const { type, token } = req.body;
    console.log(type == "Approve")
    await Token.findByIdAndUpdate(token, { approved: type == "Approve" });
    const tokens = await Token.find();
    console.log(config.mailUser, config.mailPass)

    const mail = {
      from: 'goldendev726@gmail.com',
      to: 'simba990724@gmail.com',
      message: 'Sending Email using Node.js',
      text: 'That was easy!'
    }

    // nodemailTransporter.sendMail(mail, (err, data) => {
    //   if (err) {
    //     console.log(err)
    //   } else {
    //     console.log("Email sent!")
    //   }
    // })
    res.json(tokens)
  } catch {
    res.status(400).json({ error: "Oops! An error occured" })
  }

}

exports.promoteToken = async (req, res) => {
  const { promoType, token } = req.body;
  console.log(promoType)
  let promotion = 5;
  switch (promoType) {
    case 'diamond':
      promotion = 1;
      break
    case 'gold':
      promotion = 2;
      break
    case 'silver':
      promotion = 3;
      break
    case 'bronze':
      promotion = 4;
      break
    default:
      promotion = 5;
  }

  console.log(promotion)
  await Token.findByIdAndUpdate(token, { promotion });
  const tokens = await Token.find();
  res.json(tokens)
}

exports.searchToken = async (req, res) => {
  const {date, tag, search} = req.body;
  const searchData = {date, tag, search};

  const where = { approved: true};

  if (searchData.date === "today") {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    where.createdAt = {$gte: startOfToday}
  }

  if (searchData.tag !== "all") {
    where.tags = searchData.tag
  }

  if (searchData.search !== "") {
    where.name = { $regex: searchData.search, $options: 'i'}
  } 

  console.log(where)

  const filteredTokens = await Token.find(where);
  res.json(filteredTokens);
}

exports.uploadImage = async (req, res) => {
  const { formData } = req;
  // const form = new formidable.IncomingForm();
  // form.parse(req, function (err, fields, files) {
  //   const oldPath = files.image.path;
  //   const uploadDir = path.join(__dirname, '/../uploads/');

  //   fs.exists(uploadDir, (exists) => {
  //     if (!exists) fs.mkdir(uploadDir, err => console.log(err));
  //   })

  //   const newFilePath = uploadDir + files.image.name;
  //   console.log(oldPath, newFilePath);
  //   fs.rename(oldPath, uploadDir, function(err, reply){
  //     res.send("file uploaded maybe");
  //     if (err) throw err;
  //     console.log("file upload");
  //   });
  // });
  upload(req, res, async (err) => {
    const { upper, bottom } = req.files;
    Promotion.update({}, { allowed: false });
    for (let i in req.files) {
      const newPromotion = new Promotion({
        imageUrl: `/uploads/${req.files[i][0].filename}`,
        position: req.files[i][0].fieldname
      });

      await newPromotion.save()
    }

  })
}


exports.getPromotions = async (req, res) => {
  console.log("UPload")
  const promotions = await Promotion.find().sort({ imageUrl: -1 }).limit(2);
  res.json(promotions)
}