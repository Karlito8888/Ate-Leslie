import { Event } from '../../models/index.js';
import { HTTP_STATUS } from '../../constants/http.js';
import { ApiError } from '../../utils/error.js';
import { responseHelpers } from '../../utils/response.js';
import { imageService } from '../../utils/image.js';

const { sendResponse } = responseHelpers;

export const createEvent = async (req, res, next) => {
  try {
    const eventData = {
      ...req.validatedData.body,
      images: []
    };

    if (req.files?.length) {
      for (const file of req.files) {
        const imageInfo = await imageService.processImage(file);
        eventData.images.push(imageInfo);
      }
    }

    const event = await Event.create(eventData);

    sendResponse(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: 'Event created successfully',
      data: { event }
    });
  } catch (error) {
    if (req.files?.length) {
      for (const file of req.files) {
        await imageService.deleteImage(file);
      }
    }
    next(error);
  }
};

export const getEvents = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      category, 
      startDate, 
      endDate 
    } = req.validatedData.query || {};

    const query = {};
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = category;
    }

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const totalEvents = await Event.countDocuments(query);
    const events = await Event.find(query)
      .sort({ date: 'asc' })
      .select('-__v')
      .skip((page - 1) * limit)
      .limit(limit);

    sendResponse(res, {
      data: { 
        events,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalEvents / limit),
          totalEvents
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getEvent = async (req, res, next) => {
  try {
    const { id } = req.validatedData.params;
    const event = await Event.findById(id);
    
    if (!event) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Event not found');
    }

    sendResponse(res, {
      data: { event }
    });
  } catch (error) {
    next(error);
  }
};

export const updateEvent = async (req, res, next) => {
  try {
    const { id } = req.validatedData.params;
    const updateData = req.validatedData.body;

    const event = await Event.findById(id);
    if (!event) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Event not found');
    }

    Object.assign(event, updateData);

    if (req.files?.length) {
      for (const file of req.files) {
        const imageInfo = await imageService.processImage(file);
        event.images.push(imageInfo);
      }
    }

    await event.save();

    sendResponse(res, {
      message: 'Event updated successfully',
      data: { event }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.validatedData.params;
    const event = await Event.findById(id);
    
    if (!event) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Event not found');
    }

    for (const imageInfo of event.images) {
      await imageService.deleteImage(imageInfo);
    }

    await event.remove();

    sendResponse(res, {
      message: 'Event deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
