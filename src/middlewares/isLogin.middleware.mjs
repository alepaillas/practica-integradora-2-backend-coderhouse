import { request, response } from "express";

export const isLogin = async (req = request, res = response, next) => {
  try {
    if (!req.session.user) {
      throw new Error("Usuario no logueado"); // Throw an error for clarity
    }
    next();
  } catch (error) {
    console.error(error.message);
    res.status(401).json({ status: "Error", msg: error.message });
  }
};
