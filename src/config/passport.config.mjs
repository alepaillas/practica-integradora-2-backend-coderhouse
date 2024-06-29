import passport from "passport";
import local from "passport-local";
import userDao from "../dao/mongoDao/user.dao.mjs";
import { createHash, isValidPassword } from "../utils/bcrypt.mjs";
import GitHubStrategy from "passport-github2";

const localStrategy = local.Strategy;

const initializePassport = () => {
  passport.use(
    "register",
    new localStrategy(
      { passReqToCallback: true, usernameField: "email" },
      async (req, email, password, done) => {
        const { first_name, last_name, age } = req.body;
        try {
          const user = await userDao.getByEmail(email);
          if (user) {
            console.log("User already exists");
            return done(null, false, { message: "User already exists" });
          }
          const newUser = {
            first_name,
            last_name,
            email,
            age,
            password: createHash(password),
          };
          const result = await userDao.create(newUser);
          return done(null, result);
        } catch (error) {
          return done("Error al obtener el usuario: " + error);
        }
      },
    ),
  );

  passport.use(
    "login",
    new localStrategy(
      { usernameField: "email", passReqToCallback: true },
      async (req, email, password, done) => {
        try {
          const user = await userDao.getByEmail(email);
          if (!user || !isValidPassword(user, password)) {
            return done(null, false, { message: "Invalid email or password" });
          }
          return done(null, user); // User found and authenticated
        } catch (error) {
          console.error("Error during login:", error);
          return done(error); // Pass the error to Passport
        }
      },
    ),
  );

  passport.use(
    "github",
    new GitHubStrategy(
      {
        clientID: "Iv23lim9WUlsDVBGvlNT",
        clientSecret: "3d471ed9d82dc3ed85e92c2b0787ce31b4021bc9",
        callbackURL: "http://localhost:8080/api/session/githubCallback",
        scope: ["user:email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log(profile);

          // Obtener el correo electrónico del arreglo emails
          const email =
            profile.emails && profile.emails.length > 0
              ? profile.emails[0].value
              : null;

          if (!email) {
            return done(
              new Error(
                "El correo electrónico no está disponible desde GitHub.",
              ),
            );
          }
          //console.log(email);
          const user = await userDao.getByEmail(email);
          if (!user) {
            const newUser = {
              first_name: profile._json.name,
              last_name: "",
              email: email,
              age: "",
              password: "",
            };
            const result = await userDao.create(newUser);
            return done(null, result);
          } else {
            return done(null, user); // User found and authenticated
          }
        } catch (error) {
          console.error("Error during login:", error);
          return done(error); // Pass the error to Passport
        }
      },
    ),
  );

  passport.serializeUser((user, done) => {
    done(null, user._id);
  });
  passport.deserializeUser(async (id, done) => {
    const user = await userDao.getById(id);
    done(null, user);
  });
};

export default initializePassport;
