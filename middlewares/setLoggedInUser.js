export const setLoggedInUser = (req,res,next)=>{
    const user = req.user;
    res.locals.user = user;
    next();
}
