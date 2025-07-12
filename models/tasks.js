import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: String,
    date: {
        type: Date,
        default: Date.now
    },
    category: {
        type: String
    },
    status: {
        type: String,
        enum: ["new", "active", "completed", "failed"],
        default: "new"
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    dueDate: {
        type: Date
    },
    acceptedAt: Date,
    completedAt: Date,
    failedAt: Date
},{timestamps: true});

export const Task = mongoose.model("Task", taskSchema);