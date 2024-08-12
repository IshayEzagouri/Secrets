import dotenv from "dotenv";
dotenv.config();

import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import ejs from "ejs";
import passport from "passport";

import session from "express-session";
import "./passport-config.js";

import { hashPasswordMiddleware } from "./middleware/authenticationMiddleware.js";
import db from "./db.js";

const app = express();
const port = process.env.PORT;

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: false }));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect("/secrets"); // Redirect authenticated users to /secrets
  } else {
    res.render("home.ejs"); // Render a different page or home if not authenticated
  }
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/");
  }
);

app.get("/submit", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("submit.ejs");
  } else {
    res.redirect("/login");
  }
});

app.get("/secrets", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT *
      FROM users
      WHERE secret IS NOT NULL AND secret <> '';
    `);

    const secrets = result.rows;
    res.render("secrets.ejs", { secrets });
  } catch (err) {
    console.error("Error fetching secrets:", err);
    res.status(500).send("An error occurred while fetching secrets.");
  }
});

app.post("/submit", async (req, res) => {
  console.log(" test console log result:" + req.user.email);
  const secret = req.body.secret;
  const email = req.user.email;
  if (email) {
    try {
      const result = await db.query(
        "UPDATE users SET secret=$1 WHERE email=$2",
        [secret, email]
      );
      res.redirect("/secrets");
    } catch (err) {
      console.error("Error inserting secret:", err);
      res.status(500).send("An error occurred");
    }
  } else {
    res.redirect("/login");
  }
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/logout", (req, res) => {
  req.logOut((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).send("An error occurred");
    }
    res.redirect("/");
  });
});
app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.post("/register", hashPasswordMiddleware, async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = req.body.password; // Already hashed by hashPasswordMiddleware

    // Insert the new user into the database and return the id
    const result = await db.query(
      "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id",
      [username, hashedPassword]
    );

    // Extract the userId from the result
    const userId = result.rows[0].id;

    // Log in the user and establish a session
    req.login({ id: userId }, (err) => {
      if (err) {
        console.error("Login error:", err);
        return res.status(500).send("An error occurred");
      }
      res.redirect("/secrets");
    });
  } catch (err) {
    console.error("Database query error:", err);
    res.status(500).send("An error occurred");
  }
});

app.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "login",
  }),
  (req, res) => {
    res.render("secrets.ejs");
  }
);

app.listen(port, () => {
  console.log("object listening on port " + port);
});
