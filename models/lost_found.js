var mongoose = require("mongoose");

var lostfoundSchema = new mongoose.Schema({
    item: String,
    description: String,
    image: {
        type: String,
        default: "https://tse1.mm.bing.net/th?id=OIP.UYefmuqvYGCqQqZN9xaW8QHaGp&pid=Api&P=0&h=180"
    },
    hostel: {
        type: String,
        enum: ["Rosaline", "Jasper", "Amber", "Aquamarine"],
        required: true
    },
    type: {
        type: String,
        enum: ["lost", "found"], 
        required: true
    },
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student"
        },
        username: String
    }
});

module.exports = mongoose.model("LostFound", lostfoundSchema);