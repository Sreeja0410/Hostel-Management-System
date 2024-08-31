var mongoose = require("mongoose");

var leaveSchema = new mongoose.Schema({
    request: String,
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student"
        },
        username: String
    }
});

module.exports = mongoose.model("Leave", leaveSchema);