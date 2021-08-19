const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema
const TokenSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    symbol: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    logo: {
      type: String,
      required: true
    },
    market_cap: {
      type: String,
      required: true
    },
    network: {
      type: String,
      default: 'BSC'
    },
    address: {
      type: String,
      required: true
    },
    website: {
      type: String,
      required: true
    },
    telegram: {
      type: String,
      required: true
    },
    twitter: {
      type: String,
      required: true
    },
    chart: {
      type: String,
      required: true
    },
    tags: {
      type: Array
    },
    launch_date: {
      type: Date,
      required: true
    },
    presale_date: {
      type: Date,
      default: ''
    },
    approved: {
      type: Boolean,
      default: false
    },
    promotion: {
      type: Number,
      default: 1
    },
    promotion_start: {
      type: Date
    },
    promotion_end: {
      type: Date
    },
    votes: [
      {
        ip: {
          type: String,
          required: true
        },
        last_date: {
          type: Date,
          required: true
        },
        count: {
          type: Number,
          required: true,
          default: 0
        },
      }
    ],
  },
  {
    timestamps: true
  }
);

module.exports = Token = mongoose.model("tokens", TokenSchema);
