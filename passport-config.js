import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import db from "./db.js";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";

console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);
console.log("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
    },
    async function (accessToken, refreshToken, profile, cb) {
      console.log("Google profile:", profile); // Debug the profile object
      try {
        // Check if email is available in profile._json
        const email = profile.emails[0].value;

        if (!email) {
          console.error("No email found in Google profile");
          return cb(new Error("No email found in Google profile"));
        }

        const result = await db.query(
          "SELECT * FROM users WHERE google_id = $1",
          [profile.id]
        );
        let user = result.rows[0];

        if (!user) {
          const insertUser = await db.query(
            "INSERT INTO users (email, google_id) VALUES ($1, $2) RETURNING *",
            [email, profile.id]
          );
          user = insertUser.rows[0];
        }

        console.log("Authenticated user:", user);
        return cb(null, user);
      } catch (err) {
        console.error("Error in Google strategy:", err);
        return cb(err);
      }
    }
  )
);

// Configure Passport Local Strategy
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      // Query for the user by email
      const result = await db.query("SELECT * FROM users WHERE email=$1", [
        username,
      ]);
      if (result.rows.length === 0)
        return done(null, false, { message: "User not found" });

      const user = result.rows[0];

      // Compare the provided password with the stored hashed password
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (passwordMatch) return done(null, user);
      else return done(null, false, { message: "Invalid password" });
    } catch (e) {
      return done(e);
    }
  })
);

// Serialize user ID into the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    // Query for the user by ID
    const result = await db.query("SELECT * FROM users WHERE id=$1", [id]);
    if (result.rows.length === 0) return done(new Error("User not found"));
    done(null, result.rows[0]);
  } catch (e) {
    done(e);
  }
});
