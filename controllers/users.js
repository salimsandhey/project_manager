import { User } from "../models/users.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Task } from "../models/tasks.js";
import { Invite } from "../models/invite.js";
import { Team } from "../models/team.js";
import { inviteDashboard } from "./admin.js";


export const registerUser = async (req, res) => {
    // const { username, name, email, password } = req.body;
    const username = req.body.username?.trim();
    const name = req.body.name?.trim();
    const email = req.body.email?.trim();
    const password = req.body.password;
    const inviteToken = req.body.inviteToken;
    const errors = {};
    let teamId = null;
    try {
        const extingUser = await User.findOne({ $or: [{ username: username }, { email: email }] });
        // if (!username || username.trim() === "") {
        //     errors.username = "Username is required";
        // } else if (!/^[a-zA-Z0-9_]{3,15}$/.test(username)) {
        //     errors.username = "Username must be 3-15 characters with only letters, numbers, or underscores";
        // }
        // if (!email || email.trim === "") {
        //     errors.email = "email is required"
        // } else if (!/^\S+@\S+\.\S+$/.test(email)) {
        //     errors.email = "Invalid email format";
        // }
        // if (!name || name.trim() === "") {
        //     errors.name = "name is required"
        // }   
        // if (!password || password.trim() === "") {
        //     errors.password = "Password is required"
        // }
        // if (Object.keys(errors).length > 0) {
        //     req.flash("error","All fields are required");
        //     return res.redirect("/users/register")
        //     // return res.status(400).json({ success: false, errors });
        // }
        if(!name || !username || !email || !password){
            req.flash("error","All fields are required");
            return res.redirect(`/users/register?invite=${inviteToken}`);
        }
        if (extingUser) {
            return res.status(400).json({ success: false, message: "username or email already exist" });
        }
        if(inviteToken){
            const invite = await Invite.findOne({token:inviteToken});
            if(!invite || invite.expiresAt< Date.now()){
                req.flash("error","Invalid or expired invite")
                return res.redirect("/users/register");
            }
            teamId = invite.teamId;
            invite.used = true;
            await invite.save();
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ 
            username,
            name,
            email,
            password: hashedPassword ,
            teamId
        });
        if(teamId){
            await Team.findByIdAndUpdate(teamId,{
                $push: {members: user._id}
            })
        }
        req.flash("success", "User created successfully");
        return res.redirect("/users/login");
    } catch (error) {
        console.log(error);
        req.flash("error", "Something went wrong");
        return res.redirect("/users/register");
    }
}

export const loginUser = async (req, res) => {
    const { username, password } = req.body;
    try {
        const errors = {};
        if (!username || username.trim() === "") {
            errors.username = "username is required"
        }
        if (!password || password.trim() === "") {
            errors.password = "password is required"
        }
        if (Object.keys(errors).length > 0) {
            req.flash("error", "Fill all required fields");
            res.redirect("/users/login");
            // return res.status(400).json({ success: false, errors });
        }
        const user = await User.findOne({ username });
        if (!user) {
            req.flash("error", "invalid credentials");
            return res.redirect("/users/login");
            // return res.status(400).json({ success: false, message: "" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            req.flash("error", "invalid credentials");
            return res.redirect("/users/login");
            // return res.status(400).json({ success: false, message: "invalid credentials" })
        }
        const token = jwt.sign({ _id: user._id, role: user.role }, process.env.JWT_SECRET);
        res.cookie("token", token, {
            httpOnly: true,
            maxAge: 15 * 60 * 1000
        })
        // res.status(200).json({ success: true, message: "logged in successfully" });
        req.flash("success", "Login Successfully");
        res.redirect("/users/dashboard")
    } catch (err) {
        console.log(err);
        // res.status(500).json({ success: false, message: "server error" });
        req.flash("error", "server error");
        return res.redirect("/users/login");
    }
};


const changeTaskStatus = async (req, res, newStatus) => {
    const { taskId } = req.params;
    try {
        const task = await Task.findOne({ _id: taskId, userId: req.user._id });
        if (!task) {
            req.flash("error", "No Task Found");
            return res.redirect("/users/dashboard");
        }
        const oldStatus = task.status;
        if (oldStatus === newStatus) {
            req.flash("success", `Task is already mark as ${newStatus}`);
            return res.redirect("/users/dashboard");
        }
        task.status = newStatus;
        if(newStatus === "active"){
            task.acceptedAt = new Date();
        }else if(newStatus === "completed"){
            task.completedAt = new Date();
        }else if(newStatus === "failed"){
            task.failedAt = new Date();
        }
        await task.save();
        await User.findByIdAndUpdate(req.user._id, {
            $inc: {
                [`taskCounts.${oldStatus}`]: -1,
                [`taskCounts.${newStatus}`]: 1
            },
        });
        req.flash("success", `Task Marked as ${newStatus}`);
        res.redirect("/users/dashboard");

    } catch (err) {
        console.log(err);
        req.flash("error", "server error");
        res.redirect("/users/dashboard");
    }
}

export const acceptTask = (req, res) => changeTaskStatus(req, res, "active");
export const completeTask = (req, res) => changeTaskStatus(req, res, "completed");
export const failTask = (req, res) => changeTaskStatus(req, res, "failed");

export const userData = (req, res) => {
    res.status(200).json({
        success: true,
        user: {
            _id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role
        }
    });
}

export const logout = (req, res) => {
    res.clearCookie("token");
    req.flash("success", "Logout Successfully");
    return res.redirect("/users/login");
}

export const loginForm = (req, res) => {
    res.render("login");
}

export const dashboard = async (req, res) => {
    const {status} = req.query;
    const filter  = {userId: req.user._id};
    if(status){
        filter.status = status.toLowerCase();
    }
    const tasks = await Task.find(filter);
    if(tasks.length===0){
        tasks.message = `No Task Found`; 
    }
    const user = req.user;
    res.render("employeeDashboard", { tasks, user ,status});
}


export const getAllTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ userId: req.user._id });
        res.status(200).json({
            success: true,
            tasks
        })
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "server error" });
    }
};

export const registerUserForm = async(req,res)=>{
    const inviteToken = req.query.invite;
    if(!inviteToken){
        req.flash("error","Invalid token");
        return res.redirect("/");
    }
    const invite = await Invite.findOne({token: inviteToken});
    if(!invite){
        req.flash("error","Invalid token");
        return res.redirect("/users/register");
    }
    res.render("register",{inviteToken,email: invite.email}); 
}