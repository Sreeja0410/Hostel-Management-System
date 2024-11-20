require('dotenv').config();
var express = require("express");
var app = express();
var bodyparser = require("body-parser");
var mongoose = require("mongoose");
var methodOverride = require("method-override");
var flash = require("connect-flash");
var passport = require("passport");
var localStrategy = require("passport-local");
var session = require("express-session");
var passportLocalMongoose = require("passport-local-mongoose");

var port = 3000 || process.env.PORT;
var host = '0.0.0.0' || process.env.HOST;
const path = require('path');
var Student = require("./models/student");
var Admin = require("./models/admin");
var Complaint = require("./models/complaints");
var Leave = require("./models/leave_requests");
var Notice = require("./models/notice");
var LostFound = require("./models/lost_found");
const Feedback = require("./models/feedback");
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { log } = require('console');

const multer = require('multer');



app.use(express.static('img'));
app.use(require("express-session")({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(bodyparser.urlencoded({ extended: true }));
app.use(bodyparser.json());
app.use(methodOverride("_method"));
app.use(flash());
app.use('/uploads', express.static('uploads'));

const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
const upload = multer({ storage });

const db = process.env.MongoURI;

mongoose.connect(db)
    .then(() => console.log("alll ok"))
    .catch(err => console.log(err));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(Student.authenticate()));
passport.serializeUser(Student.serializeUser());
passport.deserializeUser(Student.deserializeUser());

app.use(flash());

app.use(function (req, res, next) {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    next();
});
app.use(function (req, res, next) {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});


app.get("/", function (req, res) {
    res.render("homePage");
});

app.get("/viewhostels", function (req, res) {
    res.render("hostels");
});

app.get("/studentlogin", function (req, res) {
    res.render("studentLogin");
});

app.post("/studentlogin", async function (req, res) {
    try {
        const found = await Student.find({ username: req.body.username });

        if (found.length > 0 && found[0].password === req.body.password) {
            res.redirect("/home/student/" + found[0]._id);
        } else {
            req.flash('error_msg', 'Invalid username or password.');
            res.redirect("/studentlogin");
        }
    } catch (err) {
        req.flash('error_msg', 'Something went wrong. Please try again.');
        console.error(err);
        res.redirect("/studentlogin");
    }
});

app.get("/home/student/:id", async function (req, res) {
    try {
        const student = await Student.findById(req.params.id).exec();
        const notices = await Notice.find({ hostel: student.hostel });
        if (student) {
            res.render("studentHome", { student, notices });
        } else {
            req.flash('error_msg', 'Student not found.');
            res.redirect("/studentlogin");
        }
    } catch (err) {
        req.flash('error_msg', 'Something went wrong. Please try again.');
        console.error(err);
        res.redirect("/studentlogin");
    }
});

app.get("/leave_request/:id", async function (req, res) {
    const student = await Student.findById(req.params.id);
    res.render("leave_form", { student });
});

app.post("/leave_request/:id", async function (req, res) {
    try {
        const leave = new Leave(req.body);
        leave.author = req.params.id;
        const student = await Student.findById(req.params.id);
        student.leave_requests.push(leave);
        await student.save();
        await leave.save();
        console.log("Leave Request add success");
        res.redirect("/home/student/" + student._id);
    } catch (err) {
        console.log(err);
        res.redirect("errorPage");
    }
});

app.get("/studentLeaves/:id", async function (req, res) {
    try {
        const student = await Student.findById(req.params.id).populate('leave_requests');
        const leaves = student.leave_requests;
        res.render("studentLeaves", { leaves });
    }
    catch (err) {
        console.log(err);
    }
});

app.get("/feedback_request/:id", async function (req, res) {
    const student = await Student.findById(req.params.id);
    res.render("feedback_form", { student });
});

app.post("/feedback_request/:id", async function (req, res) {
    try {
        const feedback = new Feedback(req.body);
        feedback.author = req.params.id;
        const student = await Student.findById(req.params.id);
        student.feedback_requests.push(feedback);
        await student.save();
        await feedback.save();
        res.redirect("/home/student/" + student._id);
    } catch (err) {
        console.log(err);
        res.redirect("errorPage");
    }
});

app.get("/studentFeedbacks/:id", async function (req, res) {
    try {
        const student = await Student.findById(req.params.id).populate('feedback_requests');
        const feedbacks = student.feedback_requests;
        res.render("studentFeedbacks", { feedbacks, student });
    }
    catch (err) {
        console.log(err);
    }
});

app.get("/complaint_request/:id", async function (req, res) {
    const student = await Student.findById(req.params.id);
    res.render("complaint_form", { student });
});

app.post("/complaint_request/:id", async function (req, res) {
    try {
        const complaint = new Complaint(req.body);
        complaint.author = req.params.id;
        const student = await Student.findById(req.params.id);
        student.complaint_requests.push(complaint);
        await student.save();
        await complaint.save();
        res.redirect("/home/student/" + student._id);
    } catch (err) {
        console.log(err);
        res.redirect("errorPage");
    }
});

app.get("/studentComplaints/:id", async function (req, res) {
    try {
        const student = await Student.findById(req.params.id).populate('complaint_requests');
        const complaints = student.complaint_requests;
        res.render("studentComplaints", { complaints, student });
    }
    catch (err) {
        console.log(err);
    }
});

app.get("/lostandFound/:id", async function (req, res) {
    try {
        const student = await Student.findById(req.params.id).populate('lost_found_items');
        const lostItems = await LostFound.find({
            type: "lost",
            hostel: student.hostel
        }).select('item description image type author');

        res.render("lostandFound", { lostItems, student });

    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
    }
});

app.get("/lostandFound/foundItems/:id", async function (req, res) {
    try {
        const student = await Student.findById(req.params.id).populate('lost_found_items');
        const foundItems = await LostFound.find({
            type: "found",
            hostel: student.hostel
        }).select('item description image type author');

        res.render("foundItems", { foundItems, student });
    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
    }
});

app.get("/lostandFound/new/:type/:id", async function (req, res) {
    try {
        const { type, id } = req.params;
        const student = await Student.findById(id);
        if (!student) {
            return res.status(404).send("Student not found");
        }
        res.render("report_item", { student, type });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});


app.post("/lostandFound/:type/:id", upload.single('image'), async (req, res) => {
    try {
        const { type, id } = req.params;
        const { item, description } = req.body;
        console.log(req.file);
        const image = req.file
            ? `/uploads/${req.file.filename}`
            : "https://tse1.mm.bing.net/th?id=OIP.UYefmuqvYGCqQqZN9xaW8QHaGp&pid=Api&P=0&h=180";
        console.log(image);
        const student = await Student.findById(id);
        const newEntry = new LostFound({
            item,
            description,
            image: image,
            type,
            hostel: student.hostel,
            author: {
                id,
                username: student.first_name,
            },
        });
        //console.log(image);
        const savedEntry = await newEntry.save();
        student.lost_found_items.push(savedEntry._id);
        await student.save();

        req.flash("success", `Your ${type} item has been reported.`);
        res.redirect(`/lostandFound/${id}`);
    } catch (err) {
        console.error(err);
        res.status(500).send("An error occurred while reporting the item.");
    }
});


app.get("/displayleaves", async function (req, res) {
    try {
        const found = await Leave.find({});
        console.log("Successfully found " + found);
        res.render("displayleaves", { leaves: found });
    } catch (err) {
        console.error(err);
        res.redirect("errorPage");
    }
});

app.get("/displaycomplains", async function (req, res) {
    try {
        console.log("You are here");

        const found = await Complaints.find({});
        console.log("Successfully found " + found);
        res.render("displaycomplaints", { complaints: found });
    } catch (err) {
        console.error(err);
        res.redirect("errorPage");
    }
});

app.get("/forms", function (req, res) {
    res.render("forms");
});

app.get("/logout", function (req, res) {
    res.redirect("/");
});

app.post("/complaint", async function (req, res) {
    try {
        var complaint = {
            title: req.body.title,
            image: req.body.image,
            description: req.body.content,
            type: req.body.type,
        }
        const newComplaint = await Complaints.create(complaint);
        console.log("Complaint success");
        console.log(newComplaint);
        res.redirect("home/student/222");
    } catch (err) {
        console.log(err);
        res.redirect("errorPage");
    }
});

app.post("/leaverequest", async function (req, res) {
    try {
        var leavereq = {
            request: req.body.request,
            author: {
                id: req.user._id,
                username: req.user.username
            }
        }
        const newLeaveRequest = await Leave.create(leavereq);
        const foundUser = await Student.findById(req.user._id);
        foundUser.leave_request.push(newLeaveRequest);
        await foundUser.save();
        res.redirect("home/student/" + req.user._id);
    } catch (err) {
        console.log(err);
        res.redirect("errorPage");
    }
});


app.post("/lostitem", async function (req, res) {
    try {
        var lostitem = {
            item: req.body.item,
            image: req.body.image,
            description: req.body.description,
            type: 'LOST',
            author: {
                id: req.user._id,
                username: req.user.username
            }
        }
        const newLostItem = await LostFound.create(lostitem);
        const foundUser = await Student.findById(req.user._id);
        foundUser.lostfound.push(newLostItem);
        await foundUser.save();
        res.redirect("home/student/" + req.user._id);
    } catch (err) {
        console.log(err);
        res.redirect("errorPage");
    }
});


app.post("/founditem", async function (req, res) {
    try {
        var founditem = {
            item: req.body.item,
            image: req.body.image,
            description: req.body.description,
            type: 'FOUND',
            author: {
                id: req.user._id,
                username: req.user.username
            }
        }
        const newFoundItem = await LostFound.create(founditem);
        const foundUser = await Student.findById(req.user._id);
        foundUser.lostfound.push(newFoundItem);
        await foundUser.save();
        res.redirect("home/student/" + req.user._id);
    } catch (err) {
        console.log(err);
        res.redirect("errorPage");
    }
});



app.post("/forgot-password", async function (req, res) {
    try {
        const user = await Student.findOne({ email: req.body.email });

        if (!user) {
            req.flash('error_msg', 'No account with that email address exists.');
            return res.redirect("/studentlogin");
        }

        // Generate a token
        const token = crypto.randomBytes(20).toString('hex');

        // Set token and expiry on the user
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();


        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.MAILPWD,
            },
        });

        const mailOptions = {
            to: user.email,
            from: process.env.EMAIL,
            subject: 'Your Password for HostelHub',
            text: `You are receiving this because you (or someone else) have requested for the password for your HostelHub account.\n\n` +
                `Your Password is : ${user.password}\n\n` +
                `If you did not request this, please ignore this email.\n\n` +
                `Thanks and Regards.\n` +
                `Hostel Committee.\n`,
        };

        console.log("Sending email to:", user.email);
        await transporter.sendMail(mailOptions);
        console.log("Email sent");

        req.flash('success_msg', 'Please check your email.');
        res.redirect("/studentlogin");

    } catch (err) {
        console.error("Error in forgot-password route:", err);
        req.flash('error_msg', 'Something went wrong. Please try again.');
        res.redirect("/studentlogin");
    }
});

//admin portal routes 

app.get("/adminlogin", function (req, res) {
    res.render("adminLogin");
});

app.post("/adminlogin", async function (req, res) {
    try {
        const foundAdmin = await Admin.findOne({ uid: req.body.username });

        if (foundAdmin && foundAdmin.password === req.body.password) {
            res.redirect(`/home/admin/${foundAdmin._id}`);
        } else {
            req.flash('error_msg', 'Invalid username or password.');
            res.redirect("/adminlogin");
        }
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Something went wrong.');
        res.redirect("/adminlogin");
    }
});

app.get("/home/admin/:id", async function (req, res) {
    try {
        const uid = req.params.id;
        const admin = await Admin.findById(req.params.id);
        const complaints = await Complaint.find({});
        const feedbacks = await Feedback.find({});
        const leaves = await Leave.find({});

        if (admin) {
            res.render("adminHome", {
                uid,
                admin,
                complaints,
                feedbacks,
                leaves,
            });
        } else {
            req.flash('error_msg', 'Admin not found.');
            res.redirect("/adminlogin");
        }
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Something went wrong.');
        res.redirect("/adminlogin");
    }
});

app.get("/admin/leaves/:hostel", async (req, res) => {
    try {
        const hostelName = req.params.hostel
        const leaves = await Leave.find({ status: "pending" })
            .populate({
                path: "author",
                select: "hostel first_name last_name",
            });

        const filteredLeaves = leaves.filter(
            leave => leave.author && leave.author.hostel === hostelName
        );
        //console.log(filteredLeaves);
        res.render("adminLeaves", { leaves: filteredLeaves, hostel: req.params.hostel });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error retrieving leave requests");
    }
});


app.get("/admin/feedbacks/:hostel", async (req, res) => {
    try {
        const feedbacks = await Feedback.find({})
            .populate({
                path: "author",
                select: "hostel first_name last_name",
                match: { hostel: req.params.hostel }
            });
        const filteredFeedbacks = feedbacks.filter(feedback => feedback.author); // Filter valid authors
        res.render("adminFeedbacks", { feedbacks: filteredFeedbacks, hostel: req.params.hostel });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error retrieving feedbacks");
    }
});

app.get("/admin/complaints/:hostel", async (req, res) => {
    try {
        const complaints = await Complaint.find({ status: "pending" })
            .populate({
                path: "author",
                select: "hostel first_name last_name",
                match: { "hostel": req.params.hostel }
            });
        const filteredComplaints = complaints.filter(complaint => complaint.author);
        res.render("adminComplaints", { complaints: filteredComplaints, hostel: req.params.hostel });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error retrieving complaints");
    }
});

app.post("/admin/leaves/:id/:status", async (req, res) => {
    try {
        const { id, status } = req.params;
        const leave = await Leave.findById(id).populate("author");

        if (!leave) {
            return res.status(404).send("Leave request not found.");
        }

        leave.status = status;
        await leave.save();
        const hostelName = leave.author.hostel;
        res.redirect(`/admin/leaves/${hostelName}`);

    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

app.post("/admin/complaints/:id/:status", async (req, res) => {
    try {
        const { id, status } = req.params;


        if (!["pending", "resolved"].includes(status)) {
            return res.status(400).send("Invalid status value.");
        }


        const complaint = await Complaint.findById(id).populate("author");
        if (!complaint) {
            return res.status(404).send("Complaint not found.");
        }

        complaint.status = status;
        await complaint.save();
        res.redirect("/admin/complaints/" + complaint.author.hostel);
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

app.post("/admin/circulate/:adminId", async (req, res) => {
    try {
        const { notice, hostel } = req.body;
        const { adminId } = req.params;

        const newNotice = new Notice({
            title: notice,
            adminId: adminId,
            hostel: hostel,
            date: new Date(),
        });

        await newNotice.save();
        res.redirect("/home/admin/" + adminId);
    } catch (error) {
        console.error("Error creating notice:", error);
        res.status(500).send("An error occurred while sending the notice.");
    }
});



app.listen(port, host, function () {
    console.log("Server running at : http:/" + host + ":" + port + "/");
});
