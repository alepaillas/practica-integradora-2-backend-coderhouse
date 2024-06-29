import bcrypt from "bcrypt";

// las arrow function pueden omitir {} y el return si
// contienen solo 1 expresión
export const createHash = (password) =>
  bcrypt.hashSync(password, bcrypt.genSaltSync(10));

export const isValidPassword = (user, password) =>
  bcrypt.compareSync(password, user.password);
