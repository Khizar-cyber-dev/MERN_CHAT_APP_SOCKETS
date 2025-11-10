import express from "express";
import { signup, login, logout, updateProfile } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";
import passport from "../lib/passport.js";
import { generateToken } from "../lib/utils.js";
const router = express.Router();

router.use(arcjetProtection);

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

router.put("/update-profile", protectRoute, updateProfile);

router.get("/check", protectRoute, (req, res) => res.status(200).json(req.user));

// Google Auth Routes
router.get("/google", (req, res, next) => {
  console.log('Initiating Google OAuth...');
  passport.authenticate("google", { 
    scope: ["profile", "email"],
    accessType: 'offline',
    prompt: 'select_account consent',  // Force account selection and consent
    session: false,
    includeGrantedScopes: false  // Don't use previously granted scopes
  })(req, res, next);
});

router.get(
  "/google/callback",
  (req, res, next) => {
    console.log('Google OAuth callback received');
    passport.authenticate("google", {
      session: false,
      failureRedirect: `${process.env.CLIENT_URL}/login?error=google`
    }, (err, user, info) => {
      if (err) {
        console.error('Google Auth Error:', err);
        return res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
      }
      if (!user) {
        console.error('No user returned from Google:', info);
        return res.redirect(`${process.env.CLIENT_URL}/login?error=no_user`);
      }
      
      try {
        generateToken(user._id, res);
        return res.redirect(`${process.env.CLIENT_URL}`);
      } catch (error) {
        console.error('Error in Google callback:', error);
        res.redirect(`${process.env.CLIENT_URL}/login?error=token_error`);
      }
    })(req, res, next);
  }
);


export default router;
