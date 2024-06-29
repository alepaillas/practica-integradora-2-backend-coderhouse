import { Router } from "express";
import passport from "passport";
import { generateToken, verifyToken } from "../utils/jwt.mjs";
import {
  passportCall,
  authorization,
} from "../middlewares/passport.middleware.mjs";
import userDao from "../dao/mongoDao/user.dao.mjs";
import { isValidPassword } from "../utils/bcrypt.mjs";

const router = Router();

// la sintaxis (req,res,next) o "Callback Style" es más antigua
// que el async await. Passport trabaja con ella y es necesaria usarla
// para atrapar los errores que nos envié en las rutas de login y register
router.post("/register", (req, res, next) => {
  passport.authenticate("register", (err, user, info) => {
    try {
      // error genérico devuelto por passport
      if (err) {
        console.error("Error during registration:", err);
        return res
          .status(500)
          .json({ status: "error", msg: "Internal server error." });
      }
      // si no se pudo crear el usuario
      if (!user) {
        return res.status(400).json({
          status: "error",
          msg: info.message || "Invalid registration details",
        });
      }
      // si todo sale bien
      res.status(201).json({ status: "success", msg: "User registered." });
    } catch (error) {
      console.error("Unexpected error during registration:", error);
      return res
        .status(500)
        .json({ status: "error", msg: "Internal server error." });
    }
  })(req, res, next);
});

// la sintaxis (req,res,next) o "Callback Style" es más antigua
// que el async await. Passport trabaja con ella y es necesaria usarla
// para atrapar los errores que nos envié en las rutas de login y register
router.post("/login", (req, res, next) => {
  passport.authenticate("login", (err, user, info) => {
    try {
      // error genérico devuelto por passport
      if (err) {
        console.error("Error during login:", err);
        return res
          .status(500)
          .json({ status: "Error", msg: "Internal server error." });
      }
      // si no se encuentra el usuario o el pass es incorrecto
      if (!user) {
        return res.status(400).json({
          status: "Error",
          msg: info.message || "Invalid credentials",
        });
      }
      // req.login es una función de passport que deja un registro en el
      // servidor de que ese usuario en particular esta logueado
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error("Error during login session:", loginErr);
          return res
            .status(500)
            .json({ status: "Error", msg: "Internal server error." });
        }
        // aquí separamos roles de admin y usuario
        // por defecto todos son role: "user"
        if (user.role === "admin") {
          req.session.user = {
            first_name: user.first_name,
            last_name: user.last_name,
            age: user.age,
            email: user.email,
            role: user.role,
          };
        } else {
          req.session.user = {
            first_name: user.first_name,
            last_name: user.last_name,
            age: user.age,
            email: user.email,
          };
        }
        return res
          .status(200)
          .json({ status: "success", payload: req.session.user });
      });
    } catch (error) {
      console.error("Unexpected error during login:", error);
      return res
        .status(500)
        .json({ status: "Error", msg: "Internal server error." });
    }
  })(req, res, next);
});

router.get(
  "/github",
  passport.authenticate("github", async (req, res) => {}),
);

router.get(
  "/githubCallback",
  passport.authenticate("github", { failureRedirect: "/login" }),
  (req, res) => {
    if (req.user) {
      req.session.user = req.user;
      res.redirect("/");
    } else {
      res.redirect("/login");
    }
  },
);

/* 
router.get(
  "/current",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    res.send(req.user);
  },
);
 */

router.get(
  "/current",
  passportCall("jwt"),
  authorization("user"),
  (req, res) => {
    try {
      return res.status(200).json({ status: "success", payload: req.user });
    } catch (error) {
      console.log(error);
      res.status(500).json({ status: "Error", msg: "Internal Server Error" });
    }
  },
);

router.post("/jwt", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userDao.getByEmail(email);
    if (!user || !isValidPassword(user, password)) {
      return res
        .status(401)
        .json({ status: "error", msg: "usuario o contraseña no válido" });
    }

    const token = generateToken(user);
    res.cookie("coderCookieToken", token, { httpOnly: true });
    return res.status(200).json({ status: "success", payload: user, token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: "Error", msg: "Internal Server Error" });
  }
});

router.get("/logout", async (req, res) => {
  try {
    req.session.destroy();
    res
      .status(200)
      .json({ status: "succes", msg: "Sesión cerrada con éxito." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "Error", msg: "Internal server error." });
  }
});

export default router;
