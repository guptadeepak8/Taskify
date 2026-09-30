import nodemailer from 'nodemailer';
import { env } from '../config/env';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  ...(env.SMTP_USER && env.SMTP_PASS
    ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASS } }
    : { ignoreTLS: true }),
});

export async function sendOtpEmail(to: string, otp: string): Promise<boolean> {
  // In testing environment, avoid failing if SMTP server is not running
  if (env.NODE_ENV === 'test') {
    return true;
  }

  try {
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to,
      replyTo: env.SMTP_USER || env.SMTP_FROM,
      subject: `${otp} is your Taskify verification code`,
      text: `Your Taskify verification code is ${otp}. It is valid for 10 minutes.\n\nIf you did not request this code, you can safely ignore this email.\n\n— Taskify Team`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #134e39; margin-top: 0; margin-bottom: 12px; font-size: 22px;">Taskify Verification</h2>
          <p style="color: #475569; font-size: 15px; line-height: 22px; margin-bottom: 20px;">Use the 6-digit verification code below to complete your registration:</p>
          <div style="margin: 24px 0; text-align: center;">
            <span style="display: inline-block; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #134e39; background-color: #ebf5f0; padding: 14px 28px; border-radius: 10px; border: 1px solid #c2e0d3;">
              ${otp}
            </span>
          </div>
          <p style="color: #64748b; font-size: 13px; line-height: 18px; margin-top: 24px;">This code expires in 10 minutes and can only be used once. Never share this code with anyone.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">Taskify • Your Trusted Neighbourhood Services</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('Failed to send OTP email via SMTP:', (error as Error).message);
    return false;
  }
}
