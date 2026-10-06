
import express from "express";
import{ userRegister,userLogin,getCurrentUser} from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";
const router=express.Router();

router.post("/user/register",userRegister);
router.post("/user/login",userLogin);
router.get("/user/me",authMiddleware, getCurrentUser);




export default router;
