import { Router, type Router as ExpressRouter } from "express";
import { protect, requireActiveUser } from "../../middleware/auth.middleware";
import { UserController } from "./user.controller";
const router: ExpressRouter = Router();

// Current User

router.get("/me", protect, requireActiveUser, UserController.getMe);
router.patch("/me", protect, requireActiveUser, UserController.updateMe);
router.delete("/me", protect, requireActiveUser, UserController.deleteMe);

export default router;
