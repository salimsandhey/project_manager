import mongoose from "mongoose"
export const dbConnect = (()=>{
    mongoose.connect(process.env.MONGODB_URL)
    .then(()=>{
        console.log("database connected");
    })
    .catch((err)=>{
        console.log("error in connecting database",err);
    })
})
