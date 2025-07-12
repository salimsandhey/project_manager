import { User } from "../models/users.js";
import jwt from 'jsonwebtoken';

export const checkIfLoggedIn = async(req,res,next)=>{
    const {token} = req.cookies;
    if(!token){
        return next()
    }
    try{
        const decode = jwt.verify(token,"hkjfnkjairena");
        const user = await User.findById(decode._id);
        if(!user || user.role != "employee"){
            return next()
        }
        return res.redirect("/users/dashboard");
    }catch(err){
        return next();
    }
}