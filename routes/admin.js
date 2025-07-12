import {Router} from 'express';
import { adminDashboard, adminLogin, adminLoginForm, adminRegister, adminRegisterForm, allUserTasks, createTask, createTeam, createTeamForm, deleteInvite, deleteTask, editTaskForm, invite, inviteDashboard, inviteForm, logout, taskDetails, updateTask } from '../controllers/admin.js';
import { isAdmin } from '../middlewares/auth.js';
import { setLoggedInUser } from '../middlewares/setLoggedInUser.js';
import { checkTeamExist, checkTeamId } from '../middlewares/teamCheck.js';

const router = Router()

router.route("/register")
    .get(adminRegisterForm)
    .post(adminRegister);
router.route("/login")
    .get(adminLoginForm)
    .post(adminLogin)
router.get("/dashboard",isAdmin,setLoggedInUser,checkTeamId,adminDashboard);
router.post("/add",isAdmin,checkTeamId,createTask);
router.delete("/:taskId",isAdmin,deleteTask);
router.get("/tasks/:userId",isAdmin,setLoggedInUser,checkTeamId,allUserTasks);
router.route("/task/edit/:taskId")
    .get(isAdmin,setLoggedInUser,checkTeamId,editTaskForm)
    .put(isAdmin,checkTeamId,updateTask)
router.delete("/task/:taskId",isAdmin,checkTeamId,deleteTask);
router.get("/logout",logout);
router.route("/team")
    .get(isAdmin,setLoggedInUser,checkTeamExist,createTeamForm)
    .post(isAdmin,createTeam)

router.route("/invite")
    .get(isAdmin,setLoggedInUser,checkTeamId,inviteForm)
    .post(isAdmin,checkTeamId,invite)
router.delete("/invite/:inviteId",isAdmin,checkTeamId,deleteInvite);
router.route("/invite/dashboard")
    .get(isAdmin,setLoggedInUser,checkTeamId,inviteDashboard);

router.get("/taskdetail/:taskId",isAdmin,setLoggedInUser,taskDetails);

router.get("/reports",(req,res)=>{
    req.flash("error","Reports page will coming soon")
    res.redirect("/admin/dashboard");

})
router.get("/settings",(req,res)=>{
    req.flash("error","Setting page will coming soon")
    res.redirect("/admin/dashboard");
})

export default router