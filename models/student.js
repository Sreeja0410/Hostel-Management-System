var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var studentSchema = new mongoose.Schema({
    first_name: String,
    last_name: String,
    father_name: String,
    address: String,
    DOB: String,
    branch: String,
    gender: String,
    contact: String,
    picture: { type: String, default: "https://static.vecteezy.com/system/resources/previews/009/734/564/non_2x/default-avatar-profile-icon-of-social-media-user-vector.jpg" },
    hostel: {
        type: String,
        enum: ["Rosaline", "Jasper","Amber","Aquamarine"],
        required: true
    },
    username: String,
    password: String,
    email: String,
    complaint_requests: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Complaint"
        }
    ],
    leave_requests: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Leave"
        }
    ],
    feedback_requests: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Feedback"
        }
    ],
    lost_found_items: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "LostFound"
        }
    ],
    isAdmin: { type: Boolean, default: false },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
});

studentSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("Student", studentSchema);