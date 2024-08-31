var mongoose = require("mongoose");

var complaintSchema = new mongoose.Schema({
    title: String,
    image: String,
    description: String,
    type: String,
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student"
        },
        username: String
    }
});

module.exports = mongoose.model("Complaint", complaintSchema);