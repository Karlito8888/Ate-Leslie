import nodemailer from 'nodemailer';
import { convert } from 'html-to-text';
import { ApiError } from '../utils/error.js';
import { HTTP_STATUS } from '../constants/http.js';

class EmailService {
  constructor() {
    this.transporter = this.createTransporter();
  }

  /**
   * Create an email transporter based on configuration
   * @returns {Object} Nodemailer transporter
   */
  createTransporter() {
    try {
      // Configuration based on environment variables
      const config = {
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      };

      return nodemailer.createTransport(config);
    } catch (error) {
      console.error('Email configuration error:', error);
      throw new ApiError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR, 
        'Email service configuration error'
      );
    }
  }

  /**
   * Generate an HTML email template
   * @param {Object} params - Template parameters
   * @returns {string} Generated HTML
   */
  generateEmailTemplate(params) {
    const {
      title = 'Notification',
      preheader = '',
      content = '',
      buttonText = '',
      buttonUrl = '',
      unsubscribeUrl = ''
    } = params;

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px;
          }
          .email-container {
            background-color: #f4f4f4;
            padding: 20px;
            border-radius: 8px;
          }
          .email-header {
            background-color: #007bff;
            color: white;
            padding: 10px;
            text-align: center;
          }
          .email-content {
            background-color: white;
            padding: 20px;
            border-radius: 5px;
            margin-top: 10px;
          }
          .email-button {
            display: inline-block;
            background-color: #007bff;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 15px;
          }
          .email-footer {
            text-align: center;
            font-size: 0.8em;
            color: #666;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            <h1>${title}</h1>
          </div>
          <div class="email-content">
            ${preheader ? `<p><em>${preheader}</em></p>` : ''}
            ${content}
            ${buttonUrl && buttonText ? `
              <div style="text-align: center;">
                <a href="${buttonUrl}" class="email-button">${buttonText}</a>
              </div>
            ` : ''}
          </div>
          <div class="email-footer">
            ${unsubscribeUrl ? `
              <p>
                <a href="${unsubscribeUrl}" style="color: #666;">
                  Unsubscribe
                </a>
              </p>
            ` : ''}
            <p> ${new Date().getFullYear()} Your Organization</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Send an email
   * @param {Object} options - Email options
   * @returns {Promise<Object>} Email sending result
   */
  async sendEmail(options) {
    try {
      const { to, subject, html, text } = options;

      // Convert HTML to plain text if not provided
      const plainText = text || convert(html, {
        wordwrap: 130
      });

      const mailOptions = {
        from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
        text: plainText
      };

      const result = await this.transporter.sendMail(mailOptions);
      return result;
    } catch (error) {
      console.error('Email sending error:', error);
      throw new ApiError(
        HTTP_STATUS.INTERNAL_SERVER_ERROR, 
        'Failed to send email'
      );
    }
  }

  /**
   * Send a newsletter
   * @param {Object} newsletterData - Newsletter data
   * @param {Array} subscribers - List of subscribers
   * @returns {Promise<Object>} Sending result
   */
  async sendNewsletter(newsletterData, subscribers) {
    try {
      const { title, content, category } = newsletterData;

      // Filter subscribers by category if specified
      const filteredSubscribers = category 
        ? subscribers.filter(sub => sub.interests.includes(category))
        : subscribers;

      if (!filteredSubscribers.length) {
        throw new ApiError(
          HTTP_STATUS.BAD_REQUEST, 
          'No subscribers match the criteria'
        );
      }

      // Send in parallel
      const emailPromises = filteredSubscribers.map(subscriber => 
        this.sendEmail({
          to: subscriber.email,
          subject: title,
          html: this.generateEmailTemplate({
            title,
            content,
            preheader: `Newsletter - ${category || 'General'}`,
            buttonText: 'Read More',
            buttonUrl: process.env.APP_URL,
            unsubscribeUrl: `${process.env.APP_URL}/unsubscribe?email=${subscriber.email}`
          })
        })
      );

      const results = await Promise.allSettled(emailPromises);

      // Analyze results
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failureCount = results.filter(r => r.status === 'rejected').length;

      return {
        message: 'Newsletter sent',
        total: filteredSubscribers.length,
        sent: successCount,
        failed: failureCount
      };
    } catch (error) {
      console.error('Newsletter sending error:', error);
      throw error;
    }
  }
}

export const emailService = new EmailService();
