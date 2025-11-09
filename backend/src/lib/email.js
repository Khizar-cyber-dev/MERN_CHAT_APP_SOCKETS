import nodemailer from 'nodemailer';
import { ENV } from "../lib/env.js";

export const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false, 
  auth: {
    user: ENV.SMTP_USER,
    pass: ENV.SMTP_PASSWORD,
  },
});

export const mailOptions = (user) => {
    return{
        from: ENV.SENDER_EMAIL,
              to: user.email,
              subject: 'Welcome to DeathWalk Team!',
              html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Welcome to DeathWalk Team!</h2>
                    <p>Hello <strong>${user.name}</strong>,</p>
                    <p>Thank you for registering at our app to your death! We're excited to have you on board.</p>
                    <p>If you have any questions, feel free to reach out to our support team.</p>
                    <br>
                    <p>Best regards,</p>
                    <p><strong>The DeathWalk Team</strong></p>
                  </div>
              `,
              text: `Hello ${user.name},\n\nThank you for registering at our app!\n\nBest regards,\nThe Team DeathWalk.`
    }
};