import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from '../models/User.js';
import dotenv from 'dotenv';
import { mailOptions, transporter } from "./email.js";

dotenv.config();

const callbackBase = process.env.SERVER_URL + "/api/auth";
console.log(callbackBase);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${callbackBase}/google/callback`,
      passReqToCallback: true,
      proxy: true
    },
      async (req, accessToken, refreshToken, profile, done) => {
      try {
        console.log('Google profile received:', {
          id: profile.id,
          email: profile.emails?.[0]?.value,
          fullName: profile.displayName
        });

        const email = profile.emails?.[0]?.value;
        if (!email) {
          console.error('No email in Google profile');
          return done(new Error("No email found in Google profile"), null);
        }

        let user = await User.findOne({ email });
        console.log('Found user in DB:', user ? user.email : 'No user found');

        if (!user) {
          console.log('Creating new user with email:', email);
          user = await User.create({
            fullName: profile.displayName,
            email,
            provider: "google",
            providerId: profile.id,
            profilePic: profile.photos?.[0]?.value,
          });
          console.log('New user created:', user.email);
          try {
          await transporter.sendMail(mailOptions(user));
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
            console.error('Email error details:', {
                code: emailError.code,
                command: emailError.command,
                response: emailError.response,
                responseCode: emailError.responseCode
            });
        }
        } else {
          const googlePhoto = profile.photos?.[0]?.value;
          if (!user.profilePic && googlePhoto) {
            user.profilePic = googlePhoto;
            try {
              await user.save();
            } catch (saveErr) {
              console.error('Failed to save backfilled profilePic:', saveErr);
            }
          }
        }

        return done(null, user);
      } catch (err) {
        console.error('Error in Google strategy:', err);
        return done(err, null);
      }
    }
  )
);

export default passport;