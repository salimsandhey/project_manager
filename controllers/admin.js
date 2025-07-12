import { User } from "../models/users.js";
import { Task } from "../models/tasks.js";
import { Team } from "../models/team.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongoose, { connect } from "mongoose";
import crypto from 'crypto';
import { Invite } from "../models/invite.js";
import moment from 'moment';
import { sendInviteEmail } from "../utils/sendInviteEmail.js";


export const adminLogin = async (req, res) => {
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
            req.flash("error", "Fill all required fileds");
            return res.redirect("/admin/login");
            // return res.status(400).json({ success: false, errors });
        }
        const user = await User.findOne({ username, role: "admin" });
        if (!user) {
            req.flash("error", "Invalid Credentials");
            return res.redirect("/admin/login");
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            req.flash("error", "Invalid Credentials");
            return res.redirect("/admin/login");
        }
        const token = jwt.sign({ _id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "60m" });
        res.cookie("token", token, {
            httpOnly: true,
            maxAge: 60 * 60 * 1000
        });
        req.flash("success", "Logged In Successfully");
        res.redirect("/admin/dashboard");
    } catch (err) {
        console.log(err);
        req.flash("error", "server error");
        res.redirect("/admin/login");
    }
}

export const createTask = async (req, res) => {
    const title = req.body.title?.trim();
    const description = req.body.description?.trim();
    const date = req.body.date?.trim();
    const category = req.body.category?.trim();
    const assignTo = req.body.assignTo?.trim();
    const dueDate = req.body.dueDate;
    try {

        if (!title || !description || !date || !category || !assignTo) {
            req.flash("error", "Fill all required fields");
            return res.redirect("/admin/dashboard");
        }

        const user = await User.findById(assignTo);
        if (!user) {
            // return res.status(404).json({ success: false, message: "no user found" });
            req.flash("error", "No user found");
            return res.redirect("/admin/dashboard");
        }
        if (user.teamId?.toString() !== req.user.teamId?.toString()) {
            req.flash("error", "you can only assign task within team");
            return res.redirect("/admin/dashboard");
        }
        const task = await Task.create({ title, description, date, category, userId: assignTo, status: "new",dueDate });
        await User.findByIdAndUpdate(assignTo, {
            $inc: { "taskCounts.new": 1 }
        });
        // res.status(201).json({ success: true, message: "task created" });
        req.flash("success", "Task Created");
        return res.redirect("/admin/dashboard");

    } catch (err) {
        console.log(err);
        // res.status(400).json({ success: false, message: "server error" });
        req.flash("error", "server error");
        return res.redirect("/admin/dashboard");

    }

}
export const updateTask = async (req, res) => {
    const { taskId } = req.params;
    const title = req.body.title?.trim();
    const description = req.body.description?.trim();
    const date = req.body.date?.trim();
    const category = req.body.category?.trim();
    const assignTo = req.body.assignTo?.trim();
    const dueDate = req.body.dueDate;

    try {
        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({ success: false, message: "invalid task id" });
        }
        // if (!title || !description || !date || !category || !assignTo) {
        //     return res.status(400).json({ success: false, message: "fill all required fields" });
        // }
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ success: false, message: "task not found" });
        }
        const updates = {};
        if (task.title !== title) updates.title = title;
        if (task.category !== category) updates.category = category;
        if (task.date !== date) updates.date = date;
        if (task.description !== description) updates.description = description;
        if(task.dueDate !== dueDate) updates.dueDate = dueDate;
        const oldUserId = task.userId?.toString();
        const newUserId = assignTo;
        const statusFiled = task.status;
        if (newUserId && newUserId !== oldUserId) {
            const newUser = await User.findById(newUserId);
            const admin = await User.findById(req.user._id);
            if (!newUser) {
                // return res.status(400).json({ success: false, message: "invalid user" });
                req.flash("error", "Invalid User");
                return res.redirect(`/admin/task/edit/${taskId}`);
            }
            if (newUser.teamId.toString() !== admin.teamId.toString()) {
                req.flash("error", "Cannot assign task to user outside your team");
                return res.redirect(`/admin/task/edit/${taskId}`);
            }
            await Promise.all([
                User.findByIdAndUpdate(oldUserId, { $inc: { [`taskCounts.${statusFiled}`]: -1 } }),
                User.findByIdAndUpdate(newUserId, { $inc: { [`taskCounts.${statusFiled}`]: 1 } }),
            ]);
            updates.userId = newUserId;
        }
        if (Object.keys(updates).length > 0) {
            await Task.findByIdAndUpdate(taskId, updates);
            req.flash("success", "Task updated");
            return res.redirect(`/admin/tasks/${assignTo}`);
        }
        // res.status(200).json({ success: true, message: "task updated successfully" });
        req.flash("error", "Nothing to update");
        return res.redirect(`/admin/tasks/${assignTo}`);
        // console.log(`/admin/task/edit/${assignTo}`);
    } catch (err) {
        console.log(err);
        // res.status(500).json({ success: false, message: "server error" });
        req.flash("error", "Server error");
        return res.redirect(`/admin/task/edit/${taskId}`);
    }

}

export const deleteTask = async (req, res) => {

    const { taskId } = req.params;
    try {

        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            req.flash("error", "Invlaid Task id");
            return res.redirect(`/admin/tasks/${userId}`);
        }
        const task = await Task.findById(taskId);
        if (!task) {
            req.flash("error", "Task not found");
            return res.redirect(`/admin/tasks/${userId}`);
        }
        const userId = task.userId?.toString();
        const statusField = task.status;
        const admin = await User.findById(req.user._id);
        const assignedUser = await User.findById(userId);

        if (!assignedUser || assignedUser.teamId.toString() !== admin.teamId.toString()) {
            req.flash("error", "Unauthorized to delete this task");
            return res.redirect("/admin/dashboard");
        }
        await Task.findByIdAndDelete(taskId);

        if (userId) {
            await User.findByIdAndUpdate(userId, {
                $inc: { [`taskCounts.${statusField}`]: -1 }
            });
        }
        req.flash("success", "Task deleted");
        return res.redirect(`/admin/tasks/${userId}`);
    } catch (err) {
        console.log(err);
        req.flash("error", "Server error");
        return res.redirect(`/admin/tasks/${userId}`);
    }
}

export const adminLoginForm = (req, res) => {
    res.render("admin/login");
}

export const adminDashboard = async (req, res) => {
    try {
        const users = await User.find({ role: "employee", teamId: req.user.teamId });
        res.render("admin/dashboard", { users });
    } catch (err) {
        console.log(err);
        req.flash("error", "Server error");
        return res.redirect(`/admin/dashboard`);
    }
}

export const allUserTasks = async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await User.findById(userId);
        if (!user) {
            req.flash("error", "User not found");
            return res.redirect("/admin/dashboard");
        }
        if (user.teamId.toString() !== req.user.teamId.toString()) {
            req.flash("error", "You are not authorized to view this user's tasks");
            return res.redirect("/admin/dashboard");
        }
        let tasks = await Task.find({ userId });
        const formattedTask = tasks.map(task=>{
            const obj = task.toObject();
            return{
                ...obj,
                date: moment(task.date).format("DD MMM YYYY"),
                dueDate: moment(task.dueDate).format("DD MMM YYYY")
            }
        });
        const username = user.username;
        res.render("admin/allTasks", { tasks: formattedTask, username, userId });
    } catch (error) {
        console.log(error);
        req.flash("error", "serve error");
        res.redirect("/users/dashboard");
    }
}

export const editTaskForm = async (req, res) => {
    const { taskId } = req.params;
    try {
        const task = await Task.findById(taskId);
        if (!task) {
            req.flash("error", "Task not found");
            return res.redirect("/admin/dashboard");
        }
        const obj = task.toObject();
        const formattedTask =({
            ...obj,
            date: moment(task.date).format("YYYY-MM-DD"),
            dueDate: moment(task.dueDate).format("YYYY-MM-DD")
        })
        const userId = task.userId;
        const user = await User.findById(userId);
        const admin = await User.findById(req.user._id);
        if (!user || user.teamId.toString() !== admin.teamId.toString()) {
            req.flash("error", "You are not authorized to edit this task");
            return res.redirect("/admin/dashboard");
        }

        const users = await User.find({ role: "employee", teamId: admin.teamId });
        res.render("admin/editTask", { task: formattedTask, users, taskAssignedTo: user.username });
    } catch (error) {
        console.log(error);
        req.flash("error", "serve error");
        res.redirect("/users/dashboard");
    }
}

export const logout = (req, res) => {
    res.clearCookie("token");
    req.flash("success", "Logout Successfully");
    return res.redirect("/admin/login");
}

export const createTeamForm = (req, res) => {
    res.render("admin/createTeam");
}


export const createTeam = async (req, res) => {
    const { teamName, userId } = req.body;
    try {
        const user = await User.findById(userId);
        if (!user || user.role !== "admin") {
            req.flash("error", "admin access only")
            return res.redirect("/admin/team");
        }
        const newTeam = await Team.create({
            name: teamName,
            createdBy: user._id,
            members: [user._id]
        });
        user.teamId = newTeam._id;
        await user.save();
        req.flash("success", "team created");
        return res.redirect("/admin/dashboard");

    } catch (err) {
        req.flash("error", "serve error");
        return res.redirect("/admin/team");
    }
}
export const inviteForm = (req, res) => {
    res.render("admin/invite");
}

export const invite = async (req, res) => {
    const { userId, email } = req.body;
    try {
        const user = await User.findById(userId);
        if (!user || user.role !== "admin" || !user.teamId) {
            req.flash("error", "Unauthorized or invalid team");
            return res.redirect("/admin/invite");
        }
        const token = crypto.randomBytes(20).toString("hex");
        const inviteUrl = `${process.env.BASE_URL}users/register?invite=${token}`;
        const invite =  new Invite({
            email,
            teamId: user.teamId,
            token
        });
        try{
            await sendInviteEmail(email,inviteUrl);
            invite.emailSent=true;;
        }catch(emailErr){
            console.error("failed to send mail",emailErr.message);
            invite.emailSent = false;
        }
        await invite.save();
        req.flash("success","Invite created and email sent");
        res.redirect("/admin/invite/dashboard");
    } catch (err) {
        req.flash("error", "serve error");
        return res.redirect("/admin/invite");
    }
}

export const adminRegisterForm = (req, res) => {
    res.render("admin/register");
}

export const adminRegister = async(req, res) => {

    const username = req.body.username?.trim();
    const name = req.body.name?.trim();
    const email = req.body.email?.trim();
    const password = req.body.password;
    try {
        const extingUser = await User.findOne({ $or: [{ username: username }, { email: email }] });
        if (!name || !username || !email || !password) {
            req.flash("error", "All fields are required");
            return res.redirect(`/admin/register`);
        }
        if (extingUser) {
            req.flash("error","username or email already exist");
            return res.redirect("/admin/register");
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            username,
            name,
            email,
            password: hashedPassword,
            role: "admin"
        });
        console.log(user);
        req.flash("success", "Admin created successfully");
        return res.redirect("/admin/login");
    } catch (error) {
        console.log(error);
        req.flash("error", "Something went wrong");
        return res.redirect("/users/register");
    }
}

export const inviteDashboard = async(req,res)=>{
    const invites = await Invite.find({teamId: req.user.teamId});
    const now = moment();
    const invitesWithTime = invites.map(invite=>{
        const expiresAt = moment(invite.expiresAt);
        const duration = moment.duration(expiresAt.diff(now));
        let remaining;
        if(duration.asMilliseconds()<=0){
            remaining = "expired";
        }else{
            const hours = Math.floor(duration.asHours());
            const minitues = duration.minutes();
            remaining = `${hours}h ${minitues}min`;
        }
        return {
            ...invite._doc,
            remaining
        };
    });
    const team = await Team.findById(req.user.teamId);
    res.render("admin/inviteDashboard",{invites:invitesWithTime,team});
}

export const deleteInvite = async(req,res)=>{
    const {inviteId} = req.params;
    try{
        if(!mongoose.Types.ObjectId.isValid(inviteId)){
            req.flash("error", "Invalid Invite Id");
            return res.redirect("/admin/invite/dashboard");
        }
        const invite = await Invite.findById(inviteId);
        if(!invite){
            req.flash("error", "invite not found");
            return res.redirect("/admin/invite/dashboard");
        }
        const team = await Team.findById(invite.teamId);
        if(team.createdBy.toString()!==req.user._id.toString()){
            req.flash("error", "Unauthorized access");
            return res.redirect("/admin/invite/dashboard");
        }
        await Invite.findByIdAndDelete(inviteId);
        req.flash("success", "Invite deleted");
        return res.redirect("/admin/invite/dashboard");
    }catch (error) {
        console.log(error);
        req.flash("error", "Something went wrong");
        return res.redirect("/admin/invite/dashboard");
    }
}

export const taskDetails = async(req,res)=>{
    const {taskId} = req.params;
    const {userId} = req.query;
    try{
        if(!mongoose.Types.ObjectId.isValid(taskId)){
            req.flash("error", "invalid task id");
            return res.redirect(`/admin/tasks/${userId}`);
        }
        const task = await Task.findById(taskId);
        if(!task){
            req.flash("error", "no task found");
            return res.redirect(`/admin/tasks/${userId}`);
        }
        const user = await User.findById(task.userId);
        if(!user){
            req.flash("error", "user not found");
            return res.redirect(`/admin/tasks/${userId}`);
        }
        const team = await Team.findById(user.teamId);
        if(!team){
            req.flash("error", "no team found");
            return res.redirect(`/admin/tasks/${userId}`);
        }
        if(team.createdBy.toString()!==req.user._id.toString()){
            req.flash("error", "Unauthorized access");
            return res.redirect(`/admin/tasks/${userId}`);
        }
        // return res.json(task);
        const obj = task.toObject();
        const formattedTask = ({
            ...obj,
            date: task.date ? moment(task.date).format("DD MMM YYYY") : null,
            dueDate: task.dueDate ? moment(task.dueDate).format("DD MMM YYYY") : null,
            acceptedAt: task.acceptedAt ? moment(task.acceptedAt).format("DD MMM YYYY,hh:mm") : null,
            completedAt: task.completedAt ? moment(task.completedAt).format("DD MMM YYYY,hh:mm") : null,
            failedAt: task.failedAt ? moment(task.failedAt).format("DD MMM YYYY,hh:mm") : null,
            createdAt: moment(task.createdAt).format("DD MMM YYYY"),
            updatedAt: moment(task.updatedAt).format("DD MMM YYYY"),
        });
        // return res.json({task: formattedTask});
        res.render("admin/taskDetails",{task:formattedTask});
    }catch(error){
        console.log(error);
        req.flash("error", "server error");
        return res.redirect(`/admin/tasks/${userId}`);
    }
}
