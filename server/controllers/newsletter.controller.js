import User from '../models/user.model.js';
import { HTTP_STATUS, asyncHandler, ApiError, sendResponse, sendEmail } from '../utils/index.js';

export const newsletterController = {
  // Inscription/désinscription à la newsletter
  toggleSubscription: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'User not found');
    }

    user.newsletterSubscribed = !user.newsletterSubscribed;
    await user.save();

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: user.newsletterSubscribed ? 'Successfully subscribed to newsletter' : 'Successfully unsubscribed from newsletter'
    });
  }),

  // Envoi d'une newsletter (admin uniquement)
  sendNewsletter: asyncHandler(async (req, res) => {
    const { subject, content } = req.body;

    if (!subject || !content) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Please provide subject and content for the newsletter');
    }

    // Récupérer tous les utilisateurs inscrits à la newsletter
    const subscribers = await User.find({ newsletterSubscribed: true });

    if (subscribers.length === 0) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'No subscribers found');
    }

    // Envoyer l'email à tous les abonnés
    const emailPromises = subscribers.map(subscriber => 
      sendEmail({
        to: subscriber.email,
        subject: subject,
        text: content,
        html: `
          <div style="font-family: Arial, sans-serif;">
            <h2>${subject}</h2>
            <div>${content}</div>
            <hr>
            <p style="font-size: 12px; color: #666;">
              You received this email because you're subscribed to our newsletter.
              <br>
              To unsubscribe, go to your profile settings.
            </p>
          </div>
        `
      })
    );

    await Promise.all(emailPromises);

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: `Newsletter sent successfully to ${subscribers.length} subscribers`
    });
  })
};
