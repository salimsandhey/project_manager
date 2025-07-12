import jwt from "jsonwebtoken";
import { User } from "../models/users.js";
export const isAdmin = async (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        // return res.status(401).json({
        //     success: false,
        //     message: "Unauthorized: No token"
        // });
        req.flash("error","Unauthorized: No token");
        return res.redirect("/admin/login")
    }
    try {
        const decode = jwt.verify(token,process.env.JWT_SECRET);
        const user = await User.findById(decode._id);
        if (!user || user.role !== "admin") {
            // return res.status(403).json({
            //     success: false,
            //     message: "admin access only"
            // });
            req.flash("error","Admin Access Only");
            return res.redirect("/admin/login")
        }
        req.user = user;
        next();
    } catch (err) {
        // res.status(401).json({
        //     success: false,
        //     message: "Unauthorized: Invalid token"
        // });
        console.log(err);
        req.flash("error","Unauthorized: Invalid token");
        return res.redirect("/admin/login")
    }
}

export const isEmployee = async (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        req.flash("error","Unauthorized: Login first");
        return res.redirect("/users/login");
        // return res.status(401).json({
        //     success: false,
        //     message: "Unauthorized: No token"
        // });
    }
    try {
        const decode = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decode._id);
        if (!user || user.role !== "employee") {
            // return res.status(403).json({
            //     success: false,
            //     message: "employee access only"
            // });
            req.flash("error","invalid token");
            return res.redirect("/users/login")
        }
        req.user = user;
        next()
    } catch (err) {
        console.log(err);
        req.flash("error","server error");
        return res.redirect("/users/login")
    }

}

export const isAuthenticated = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ success: false, message: "Not logged in" });

  try {
    const decoded = jwt.verify(token, "hkjfnkjairena"); // ideally use .env
    req.user = await User.findById(decoded._id);
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};