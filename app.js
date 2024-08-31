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
var host = '127.0.0.1' || process.env.HOST;

var Student = require("./models/student");
var Admin = require("./models/admin");
var Complaints = require("./models/complaints");
var Leave = require("./models/leave_requests");
var LostFound = require("./models/lost_found");
const crypto = require('crypto');
const nodemailer = require('nodemailer');

app.use(express.static('img'));

app.use(require("express-session")({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(bodyparser.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(flash());

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
    res.render("landing2");
    //res.send("server is up and running.");
});

app.get("/viewhostels", function (req, res) {
    res.render("hostels");
});

app.get("/studentlogin", function (req, res) {
    res.render("index11STD");
});

app.get("/adminlogin", function (req, res) {
    res.render("index11ADMIN");
});

app.post("/studentlogin", async function (req, res) {
    try {
        console.log("Hello");
        console.log(req.body.username);
        console.log(req.body.password);

        const found = await Student.find({ username: req.body.username });

        if (found.length > 0 && found[0].password === req.body.password) {
            res.redirect("/home/student/" + found[0]._id);
            console.log("success");
        } else {
            req.flash('error_msg', 'Invalid username or password.');
            res.redirect("/studentlogin");
            console.log(found);
            console.log("actual pass = " + (found[0]?.password || "not found"));
        }
    } catch (err) {
        req.flash('error_msg', 'Something went wrong. Please try again.');
        console.error(err);
        res.redirect("/studentlogin");
    }
});

app.post("/adminlogin", async function (req, res) {
    try {
        console.log("Hello");
        console.log(req.body.username);
        console.log(req.body.password);

        const found = await Student.find({ username: req.body.username });

        if (found.length > 0 && found[0].password === req.body.password) {
            res.redirect("/home/admin");
            console.log("success");
        } else {
            res.redirect("/adminlogin");
            console.log(found);
            console.log("actual pass = " + (found[0]?.password || "not found"));
        }
    } catch (err) {
        console.error(err);
        res.redirect("/adminlogin");
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

app.get("/displayleaves", async function (req, res) {
    try {
        console.log("You are here");

        const found = await Leave.find({});
        console.log("Successfully found " + found);
        res.render("displayleaves", { leaves: found });
    } catch (err) {
        console.error(err);
        res.redirect("errorPage"); 
    }
});

app.get("/forms", function (req, res) {
    res.render("forms");
});

app.get("/leave_request", function (req, res) {
    res.render("leave_form");
});

app.get("/logout", function (req, res) {
    res.redirect("/landing2");
});

app.get("/home/student/:id", async function (req, res) {
    try {
        const student = await Student.findById(req.params.id).exec();

        if (student) {
            res.render("studenthome", { student });
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

app.get("/home/admin", function (req, res) {
    console.log("login success");
    res.render("adminHome");
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



app.post("/leave_req", async function (req, res) {
    try {
        var leave = {
            request: req.body.request,
            author: {
                username: "STUDENT XYZ"
            }
        }
        const newLeave = await Leave.create(leave);
        console.log("Leave Request add success");
        console.log(newLeave);
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

app.listen(port, host,'0.0.0.0', function () {
    console.log("Server running at : http:/" + host + ":" + port + "/");
});
