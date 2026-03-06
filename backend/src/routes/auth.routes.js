"use strict";
import { Router } from "express";
import { register, login } from "../controller/auth.controller.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);

export { router as authRouter };
