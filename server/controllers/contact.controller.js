import Contact from '../models/contact.model.js';
import { HTTP_STATUS, asyncHandler, ApiError, sendResponse, sendEmail } from '../utils/index.js';

export const contactController = {
  // Create a new contact message
  createContact: asyncHandler(async (req, res) => {
    const { type, name, email, phoneNumber, message, rating } = req.body;
    
    // Add user ID if logged in
    const userId = req.user?.id || null;

    const contact = await Contact.create({
      type,
      name,
      email,
      phoneNumber,
      message,
      rating,
      userId
    });

    // Send notification email to admins
    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: `New Contact Message - ${type}`,
      html: `
        <h2>New Contact Message</h2>
        <p><strong>Type:</strong> ${type}</p>
        <p><strong>From:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${phoneNumber ? `<p><strong>Phone:</strong> ${phoneNumber}</p>` : ''}
        ${rating ? `<p><strong>Rating:</strong> ${rating}/5</p>` : ''}
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `
    });

    // Send confirmation email to user
    await sendEmail({
      to: email,
      subject: 'Message Received Confirmation',
      html: `
        <h2>Hello ${name},</h2>
        <p>We have received your message and thank you for reaching out.</p>
        <p>Our team will review it and get back to you shortly.</p>
        ${type === 'callback' ? '<p>We will contact you soon at the provided phone number.</p>' : ''}
        <p>Best regards,<br>The Ate Leslie Team</p>
      `
    });

    sendResponse(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: 'Message sent successfully',
      data: contact
    });
  }),

  // List all messages (admin only)
  getContacts: asyncHandler(async (req, res) => {
    const { status, type } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const contacts = await Contact.find(filter)
      .sort({ createdAt: -1 })
      .populate('userId', 'username email')
      .populate('assignedTo', 'username email');

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      data: contacts
    });
  }),

  // Update message status (admin only)
  updateContactStatus: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, assignedTo } = req.body;

    const contact = await Contact.findById(id);
    if (!contact) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Contact message not found');
    }

    contact.status = status || contact.status;
    contact.assignedTo = assignedTo || contact.assignedTo;
    await contact.save();

    // Send follow-up email when status changes to "completed"
    if (status === 'completed') {
      await sendEmail({
        to: contact.email,
        subject: 'Message Follow-up',
        html: `
          <h2>Hello ${contact.name},</h2>
          <p>Your request has been processed by our team.</p>
          <p>Please don't hesitate to contact us again if you have any further questions.</p>
          <p>Best regards,<br>The Ate Leslie Team</p>
        `
      });
    }

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Contact status updated successfully',
      data: contact
    });
  })
};
