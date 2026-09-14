import { Router } from "express";
import registerController from "../../controllers/auth/register.controllers.js";

const router = Router();

router.post("/auth/register", registerController);

export default router;