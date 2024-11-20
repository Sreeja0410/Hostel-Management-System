var mongoose = require("mongoose");

var feedbackSchema = new mongoose.Schema({
    type: String,
    description: String,
    rating: Number,
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student"
    }
});

module.exports = mongoose.model("Feedback", feedbackSchema);