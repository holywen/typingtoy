import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  private transporter: Transporter | null = null;

  private getTransporter(): Transporter {
    if (this.transporter) {
      return this.transporter;
    }

    // Check if email is configured
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      throw new Error('Email service not configured. Please set SMTP environment variables.');
    }

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    return this.transporter;
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    const transporter = this.getTransporter();
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;

    await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
  }

  async sendVerificationEmail(email: string, token: string, userName?: string): Promise<void> {
    const verificationUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${token}`;
    const displayName = userName || email.split('@')[0];

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email - Typing Toy</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9fafb;
              border-radius: 8px;
              padding: 40px;
              border: 1px solid #e5e7eb;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #1e40af;
              margin: 0;
              font-size: 28px;
            }
            .content {
              background-color: white;
              padding: 30px;
              border-radius: 6px;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }
            .button {
              display: inline-block;
              padding: 12px 32px;
              background-color: #2563eb;
              color: white !important;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              margin: 20px 0;
              text-align: center;
            }
            .button:hover {
              background-color: #1d4ed8;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 14px;
              color: #6b7280;
            }
            .link {
              color: #2563eb;
              word-break: break-all;
            }
            .warning {
              background-color: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 12px;
              margin: 20px 0;
              border-radius: 4px;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⌨️ Typing Toy</h1>
            </div>
            <div class="content">
              <h2>Welcome, ${displayName}!</h2>
              <p>Thank you for registering with Typing Toy. To complete your registration and activate your account, please verify your email address.</p>

              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </div>

              <p>Or copy and paste this link into your browser:</p>
              <p class="link">${verificationUrl}</p>

              <div class="warning">
                <strong>⏰ This link will expire in 24 hours.</strong> If you didn't create an account with Typing Toy, you can safely ignore this email.
              </div>

              <p>Once verified, you'll be able to:</p>
              <ul>
                <li>Access all typing lessons and games</li>
                <li>Track your progress and statistics</li>
                <li>Compete in multiplayer typing battles</li>
                <li>Save your settings across devices</li>
              </ul>
            </div>
            <div class="footer">
              <p>This email was sent by Typing Toy. If you have any questions, contact us at <a href="mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'typingtoy@444666.best'}" style="color: #2563eb;">${process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'typingtoy@444666.best'}</a></p>
              <p>&copy; ${new Date().getFullYear()} Typing Toy. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Verify your email address - Typing Toy',
      html,
    });
  }

  async sendPasswordResetEmail(email: string, token: string, userName?: string): Promise<void> {
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;
    const displayName = userName || email.split('@')[0];

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password - Typing Toy</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9fafb;
              border-radius: 8px;
              padding: 40px;
              border: 1px solid #e5e7eb;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #1e40af;
              margin: 0;
              font-size: 28px;
            }
            .content {
              background-color: white;
              padding: 30px;
              border-radius: 6px;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }
            .button {
              display: inline-block;
              padding: 12px 32px;
              background-color: #2563eb;
              color: white !important;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              margin: 20px 0;
              text-align: center;
            }
            .button:hover {
              background-color: #1d4ed8;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 14px;
              color: #6b7280;
            }
            .link {
              color: #2563eb;
              word-break: break-all;
            }
            .warning {
              background-color: #fee2e2;
              border-left: 4px solid #ef4444;
              padding: 12px;
              margin: 20px 0;
              border-radius: 4px;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⌨️ Typing Toy</h1>
            </div>
            <div class="content">
              <h2>Hello, ${displayName}</h2>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>

              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>

              <p>Or copy and paste this link into your browser:</p>
              <p class="link">${resetUrl}</p>

              <div class="warning">
                <strong>⏰ This link will expire in 1 hour.</strong> If you didn't request a password reset, you can safely ignore this email.
              </div>
            </div>
            <div class="footer">
              <p>This email was sent by Typing Toy. If you have any questions, contact us at <a href="mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'typingtoy@444666.best'}" style="color: #2563eb;">${process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'typingtoy@444666.best'}</a></p>
              <p>&copy; ${new Date().getFullYear()} Typing Toy. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Reset your password - Typing Toy',
      html,
    });
  }
}

export const emailService = new EmailService();
