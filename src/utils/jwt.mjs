import { request, response } from "express";
import jwt from "jsonwebtoken";

const PRIVATE_KEY = "CoderKeyQueFuncionaComoUnSecret";

export const generateToken = (user) => {
  const { _id, email, role } = user;
  const token = jwt.sign({ _id, email, role }, PRIVATE_KEY, {
    expiresIn: "1m",
  });
  return token;
};

export const verifyToken = (token) => {
  try {
    const decode = jwt.verify(token, PRIVATE_KEY);
    return decode;
  } catch (error) {
    return null;
  }
};

/* 
const authToken = (request, response, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return response.status(401).send({ error: "Not autehnticated." });

  const token = authHeader.split(" ")[1];
  jwt.verify(token, PRIVATE_KEY, (error, credentials) => {
    if (error) return response.status(403).send({ error: "Not Authorized." });
    req.user = credentials.user;
    next();
  });
};
 */
