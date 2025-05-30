const mongoose = require("mongoose");

const stepSchema = new mongoose.Schema({
  title: String,
  content: String,
  selector: String,
  order: Number,
});

const tourSchema = new mongoose.Schema({
  title: String,
  description: String,
  views: { type: Number, default: 0 },
  published: { type: Boolean, default: false },
  steps: [stepSchema],
}, { timestamps: true });

module.exports = mongoose.model("Tour", tourSchema);


