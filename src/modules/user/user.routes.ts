import { Router, type Router as ExpressRouter } from "express";
import { protect, requireActiveUser } from "../../middleware/auth.middleware";
import { UserController } from "./user.controller";
const router: ExpressRouter = Router();

router.get("/:userId", UserController.getUser);

// Current User

router.get("/", protect, requireActiveUser, UserController.getMe);
router.patch("/", protect, requireActiveUser, UserController.updateMe);
router.delete("/", protect, requireActiveUser, UserController.deleteMe);

export default router;
