import mongoose from "mongoose";

const inviteSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    teamId: {
        type: mongoose.Types.ObjectId,
        ref: "Team",
        required: true
    },
    token: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        default: ()=> Date.now() + 1000 * 60 * 60 * 24
    },
    emailSent: {
        type: Boolean,
        default: false
    },
    used: {
        type: Boolean,
        default: false
    }
})
export const Invite = mongoose.model("Invite",inviteSchema);