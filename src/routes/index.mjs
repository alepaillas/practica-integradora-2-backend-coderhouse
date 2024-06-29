import { Router } from "express";
import productsRouter from "./products.routes.mjs";
import cartsRouter from "./carts.routes.mjs";
import sessionRouter from "./session.routes.mjs";
import { isLogin } from "../middlewares/isLogin.middleware.mjs";

const router = Router();

router.use("/products", isLogin, productsRouter);
router.use("/carts", cartsRouter);
router.use("/session", sessionRouter);

export default router;
