import Event from '../models/event.model.js';
import { HTTP_STATUS, asyncHandler, ApiError, sendResponse } from '../utils/index.js';
import { imageService } from '../services/image.service.js';

export const eventController = {
  // Créer un nouvel événement
  createEvent: asyncHandler(async (req, res) => {
    const { title, description, startDate, endDate, location } = req.body;
    
    // Traiter les images uploadées
    const processedImages = [];
    if (req.files?.length) {
      for (const file of req.files) {
        const imageInfo = await imageService.processImage(file);
        processedImages.push(imageInfo);
      }
    }

    const event = await Event.create({
      title,
      description,
      images: processedImages,
      startDate,
      endDate,
      location,
      createdBy: req.user.id
    });

    sendResponse(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: 'Event created successfully',
      data: event
    });
  }),

  // Mettre à jour un événement
  updateEvent: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description, startDate, endDate, location } = req.body;
    
    const event = await Event.findById(id);
    if (!event) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Event not found');
    }

    // Vérifier que l'utilisateur est l'admin
    if (req.user.role !== 'admin') {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Not authorized to update this event');
    }

    // Traiter les nouvelles images si présentes
    if (req.files?.length) {
      // Supprimer les anciennes images
      for (const image of event.images) {
        await imageService.deleteImage(image);
      }

      // Traiter les nouvelles images
      const processedImages = [];
      for (const file of req.files) {
        const imageInfo = await imageService.processImage(file);
        processedImages.push(imageInfo);
      }
      event.images = processedImages;
    }

    // Mettre à jour les autres champs
    Object.assign(event, {
      title: title || event.title,
      description: description || event.description,
      startDate: startDate || event.startDate,
      endDate: endDate || event.endDate,
      location: location || event.location
    });

    await event.save();

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Event updated successfully',
      data: event
    });
  }),

  // Supprimer un événement
  deleteEvent: asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const event = await Event.findById(id);
    if (!event) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Event not found');
    }

    // Vérifier que l'utilisateur est l'admin
    if (req.user.role !== 'admin') {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Not authorized to delete this event');
    }

    // Supprimer toutes les images et leurs vignettes
    for (const image of event.images) {
      await imageService.deleteImage(image);
    }

    await event.deleteOne();

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Event deleted successfully'
    });
  }),

  // Récupérer tous les événements
  getEvents: asyncHandler(async (req, res) => {
    const events = await Event.find({ isActive: true })
      .sort({ startDate: 1 });

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      data: events
    });
  }),

  // Récupérer un événement spécifique
  getEvent: asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const event = await Event.findById(id);
    if (!event) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Event not found');
    }

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      data: event
    });
  })
};
