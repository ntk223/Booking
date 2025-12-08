import nodemailer from "nodemailer";
import logger from "../logger/winston.log.js";
import { env } from "../config/environment.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MailService {
  constructor() {
    // Check if mail credentials are configured
    if (
      !process.env.MAIL_HOST ||
      !process.env.MAIL_USER ||
      !process.env.MAIL_PASS
    ) {
      logger.warn(
        "[MAIL] Mail credentials not configured. Mail service will be disabled."
      );
      this.transporter = null;
      return;
    }

    // Create SMTP transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: parseInt(process.env.MAIL_PORT) || 587,
      secure: process.env.MAIL_SECURE === "true", // true for 465, false for other ports
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    // Verify connection configuration
    this.transporter.verify((error, success) => {
      if (error) {
        logger.error("[MAIL] SMTP connection error:", error);
      } else {
        logger.info("[MAIL] Mail service is ready to send emails");
      }
    });
  }

  /**
   * Load email template from file
   * @param {string} templateName - Name of template file (without .html)
   * @param {object} variables - Variables to replace in template
   * @returns {string} - HTML content
   */
  loadTemplate(templateName, variables = {}) {
    try {
      const templatePath = path.join(
        __dirname,
        "../templates/emails",
        `${templateName}.html`
      );
      let html = fs.readFileSync(templatePath, "utf8");

      // Replace variables in template
      Object.keys(variables).forEach((key) => {
        const regex = new RegExp(`{{${key}}}`, "g");
        html = html.replace(regex, variables[key]);
      });

      return html;
    } catch (error) {
      logger.error(`[MAIL] Error loading template ${templateName}:`, error);
      return null;
    }
  }

  /**
   * Send email
   * @param {object} options - Email options
   * @param {string} options.to - Recipient email
   * @param {string} options.subject - Email subject
   * @param {string} options.html - HTML content
   * @param {string} options.text - Plain text content (optional)
   * @returns {Promise<object>} - Send result
   */
  async sendMail({ to, subject, html, text }) {
    if (!this.transporter) {
      logger.warn("[MAIL] Mail service is disabled. Skipping email send.");
      return { success: false, message: "Mail service not configured" };
    }

    try {
      const mailOptions = {
        from: `"${process.env.MAIL_FROM_NAME || "Booking System"}" <${
          process.env.MAIL_FROM || process.env.MAIL_USER
        }>`,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ""), // Strip HTML tags for text version
      };

      const info = await this.transporter.sendMail(mailOptions);

      logger.info("[MAIL] Email sent successfully", {
        messageId: info.messageId,
        to,
        subject,
      });

      return {
        success: true,
        messageId: info.messageId,
        response: info.response,
      };
    } catch (error) {
      logger.error("[MAIL] Error sending email:", error);
      throw error;
    }
  }

  /**
   * Send booking confirmation email
   */
  async sendBookingConfirmation({
    to,
    userName,
    roomName,
    startTime,
    endTime,
    bookingId,
  }) {
    const html = this.loadTemplate("booking-confirmation", {
      userName,
      roomName,
      startTime: new Date(startTime).toLocaleString("vi-VN"),
      endTime: new Date(endTime).toLocaleString("vi-VN"),
      bookingId,
    });

    if (!html) {
      throw new Error("Failed to load booking confirmation template");
    }

    return this.sendMail({
      to,
      subject: `Xác nhận đặt phòng - ${roomName}`,
      html,
    });
  }

  /**
   * Send booking cancellation email
   */
  async sendBookingCancellation({
    to,
    userName,
    roomName,
    startTime,
    bookingId,
  }) {
    const html = this.loadTemplate("booking-cancellation", {
      userName,
      roomName,
      startTime: new Date(startTime).toLocaleString("vi-VN"),
      bookingId,
    });

    if (!html) {
      throw new Error("Failed to load booking cancellation template");
    }

    return this.sendMail({
      to,
      subject: `Hủy đặt phòng - ${roomName}`,
      html,
    });
  }

  /**
   * Send booking reminder email (1 day before)
   */
  async sendBookingReminder({
    to,
    userName,
    roomName,
    startTime,
    endTime,
    bookingId,
  }) {
    const html = this.loadTemplate("booking-reminder", {
      userName,
      roomName,
      startTime: new Date(startTime).toLocaleString("vi-VN"),
      endTime: new Date(endTime).toLocaleString("vi-VN"),
      bookingId,
    });

    if (!html) {
      throw new Error("Failed to load booking reminder template");
    }

    return this.sendMail({
      to,
      subject: `Nhắc nhở đặt phòng - ${roomName}`,
      html,
    });
  }
}

// Export singleton instance
export default new MailService();
