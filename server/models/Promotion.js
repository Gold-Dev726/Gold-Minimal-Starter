const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema
const PromotionSchema = new Schema(
  {
    
    imageUrl: {
      type: String,
      required: true
    },
    position: {
      type: String,
      required: true,
    },
    allowed: {
      type: Boolean,
      required: true,
      default: true
    }
  },
  {
    timestamp: true
  }
);

module.exports = Promotion = mongoose.model("promotions", PromotionSchema);
