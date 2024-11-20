var mongoose = require("mongoose");

var noticeSchema = new mongoose.Schema({
    title: String,
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
    },
    hostel: String,
    date: Date
});

module.exports = mongoose.model("Notice", noticeSchema);