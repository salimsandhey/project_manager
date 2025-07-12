import {Router} from 'express';
import { acceptTask, completeTask, dashboard, failTask, getAllTasks, loginForm, loginUser, logout, registerUser, registerUserForm, userData } from '../controllers/users.js';
import { isAuthenticated, isEmployee } from '../middlewares/auth.js';
import { checkIfLoggedIn } from '../middlewares/checkIfLoggedIn.js';

const router = Router();
router.route("/register")
    .get(registerUserForm)
    .post(registerUser)
router.route("/login")
    .get(checkIfLoggedIn,loginForm)
    .post(loginUser)
router.get("/tasks",isEmployee,getAllTasks);
router.patch("/:taskId/accept",isEmployee,acceptTask);
router.patch("/:taskId/complete",isEmployee,completeTask);
router.patch("/:taskId/fail",isEmployee,failTask);
router.get("/me",isAuthenticated,userData);
router.get("/logout",logout);
router.get("/dashboard",isEmployee,dashboard);


export default router