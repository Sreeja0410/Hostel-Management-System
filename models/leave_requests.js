var mongoose = require("mongoose");

var leaveSchema = new mongoose.Schema({
    reason: String, 
    type: String, 
    startDate: Date, 
    endDate: Date,
    status: {
        type: String,
        enum: ["approved", "denied", "pending"],
        default: "pending"
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student"
    }
});

module.exports = mongoose.model("Leave", leaveSchema);