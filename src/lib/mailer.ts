import nodemailer from "nodemailer";
import { logger } from "./logger";

interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

class Mailer {
  private transporter: nodemailer.Transporter;
  private readonly defaultFrom: string;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || "587", 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      logger.warn("Email configuration missing, emails will be logged but not sent");
    }

    this.defaultFrom = process.env.EMAIL_FROM || "noreply@civictraceops.org";

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });
  }

  /**
   * Send an email
   */
  async sendMail(options: EmailOptions): Promise<boolean> {
    try {
      if (!this.isConfigured()) {
        // Log the email instead of sending in development
        logger.info("Email would have been sent", {
          to: options.to,
          subject: options.subject,
          text: options.text,
        });
        return true;
      }

      const mailOptions = {
        from: this.defaultFrom,
        ...options,
      };

      const info = await this.transporter.sendMail(mailOptions);

      logger.info("Email sent successfully", {
        messageId: info.messageId,
        to: options.to,
        subject: options.subject,
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error("Failed to send email", {
        error: errorMessage,
        to: options.to,
        subject: options.subject,
      });
      return false;
    }
  }

  /**
   * Send a verification email
   */
  async sendVerificationEmail(to: string, token: string): Promise<boolean> {
    const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/verify-email?token=${token}`;

    return this.sendMail({
      to,
      subject: "Verify your email address",
      html: `
        <h1>Welcome to CIVIC TRACE OPS</h1>
        <p>Please verify your email address by clicking the link below:</p>
        <p><a href="${verifyUrl}">Verify Email Address</a></p>
        <p>If you did not create an account, please ignore this email.</p>
      `,
    });
  }

  /**
   * Send a password reset email
   */
  async sendPasswordResetEmail(to: string, token: string): Promise<boolean> {
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${token}`;

    return this.sendMail({
      to,
      subject: "Reset your password",
      html: `
        <h1>Password Reset Request</h1>
        <p>You have requested to reset your password. Click the link below to proceed:</p>
        <p><a href="${resetUrl}">Reset Password</a></p>
        <p>If you did not request this, please ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
      `,
    });
  }

  /**
   * Send a notification email
   */
  async sendNotificationEmail(to: string, subject: string, message: string): Promise<boolean> {
    return this.sendMail({
      to,
      subject,
      html: `
        <h1>${subject}</h1>
        <p>${message}</p>
      `,
    });
  }

  /**
   * Check if mailer is properly configured
   */
  private isConfigured(): boolean {
    return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
  }

  /**
   * Verify SMTP connection
   */
  async verifyConnection(): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error("Failed to verify SMTP connection", { error: errorMessage });
      return false;
    }
  }
}

// Export singleton instance
export const mailer = new Mailer();

// Export class for testing
export { Mailer };
