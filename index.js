import express from 'express';
import user from './routes/users.js'
import admin from './routes/admin.js'
import mongoose from 'mongoose';
import { dbConnect } from './others/database.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import ejs from 'ejs';
import expressEjsLayouts from 'express-ejs-layouts';
import path from 'path';
import flash from 'connect-flash';
import session from 'express-session';
import methodOverride from 'method-override';
import dotenv from 'dotenv';


dotenv.config({path:"./others/.env"});

const app = express();

dbConnect();
app.listen(process.env.PORT,()=>{
    console.log("app is working");
});

app.use(session({
    secret: "hello",
    resave: false,
    saveUninitialized: true
}));
app.use(flash());
app.use(express.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.json());
app.use(cookieParser());
app.use(expressEjsLayouts);
app.set("layout","layout");
// app.use(cors({
//     origin: "http://localhost:5173",
//     methods: ["POST","GET","PUT","DELETE","PATCH"],
//     credentials: true
// }));
app.use(express.static(path.join(path.resolve(),"/public")));
app.use(methodOverride('_method'));

app.use((req,res,next)=>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
})
app.use("/users",user);


app.use("/admin",admin);

// app.get("/all",(req,res)=>{
//     res.render("admin/allTasks");
// })
// app.get("/edit",(req,res)=>{
//     res.render("admin/editTask");
// })
app.get("/",(req,res)=>{
    res.render("home");
})