import mongoose from "mongoose";

const taskCountsSchema = new mongoose.Schema({
    active: { type: Number, default: 0 },
    new: { type: Number, default: 0 },
    completed: { type: Number, default: 0 },
    failed: { type: Number, default: 0 }
}, { _id: false });

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    taskCounts: {
        type: taskCountsSchema,
        default: ()=>({})
    },
    role: {
        type: String,
        enum: ["admin","employee"],
        default: "employee"
    },
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team",
        default: null
    }
});

export const User = mongoose.model("User", userSchema);