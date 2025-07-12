export const checkTeamId = (req,res,next)=>{
    const admin = req.user;
    if(!admin.teamId){
        console.log("hello")
       return res.redirect("/admin/team"); 
    }
    return next();
}

export const checkTeamExist = (req,res,next)=>{
    const admin = req.user;
    if(admin.teamId){
        req.flash("error","You Already have a team");
        return res.redirect("/admin/dashboard");
    }
    next();
}

