var mongoose = require("mongoose");

var lostfoundSchema = new mongoose.Schema({
    item: String,
    description: String,
    image: String,
    type: String,
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student"
        },
        username: String
    }
});

module.exports = mongoose.model("LostFound", lostfoundSchema);