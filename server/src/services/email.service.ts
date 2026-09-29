import nodemailer from 'nodemailer';
import { env } from '../config/env';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  ignoreTLS: true,
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
      subject: 'Your Verification Code - PadosiPro',
      text: `Your verification code is: ${otp}. It expires in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #111827; margin-bottom: 8px;">Email Verification</h2>
          <p style="color: #4b5563; font-size: 15px;">Use the following 6-digit verification code to complete your registration:</p>
          <div style="margin: 24px 0; text-align: center;">
            <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #2563eb; background-color: #eff6ff; padding: 12px 24px; border-radius: 8px;">
              ${otp}
            </span>
          </div>
          <p style="color: #6b7280; font-size: 13px;">This code expires in 10 minutes and can only be used once. Please do not share it with anyone.</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('Failed to send OTP email via SMTP:', (error as Error).message);
    // Return false instead of crashing so the user still gets a clear response
    return false;
  }
}
