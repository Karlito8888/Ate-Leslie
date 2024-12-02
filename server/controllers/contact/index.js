import { Contact } from '../../models/index.js';
import { HTTP_STATUS } from '../../constants/http.js';
import { ApiError } from '../../utils/error.js';
import { responseHelpers } from '../../utils/response.js';

const { sendResponse } = responseHelpers;

export const createContact = async (req, res, next) => {
  try {
    const contactData = req.validatedData.body;
    const contact = await Contact.create(contactData);

    sendResponse(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: 'Message sent successfully',
      data: { contact }
    });
  } catch (error) {
    next(error);
  }
};

export const getContacts = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      status 
    } = req.validatedData.query || {};

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      query.status = status;
    }

    const totalContacts = await Contact.countDocuments(query);
    const contacts = await Contact.find(query)
      .sort({ createdAt: 'desc' })
      .skip((page - 1) * limit)
      .limit(limit);

    sendResponse(res, {
      data: { 
        contacts,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalContacts / limit),
          totalContacts
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateContactStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.validatedData.body;

    const contact = await Contact.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!contact) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Contact not found');
    }

    sendResponse(res, {
      message: 'Contact status updated successfully',
      data: { contact }
    });
  } catch (error) {
    next(error);
  }
};
