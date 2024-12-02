import { User } from '../../models/index.js';
import { HTTP_STATUS } from '../../constants/http.js';
import { ApiError } from '../../utils/error.js';
import { responseHelpers } from '../../utils/response.js';
import { config } from '../../config/index.js';

const { sendResponse } = responseHelpers;

export const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search } = req.validatedData.query || {};

    const query = { role: 'user' };
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }

    const totalUsers = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(limit);
    
    sendResponse(res, {
      data: { 
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalUsers / limit),
          totalUsers
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAdmins = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search } = req.validatedData.query || {};

    const query = { role: 'admin' };
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }

    const totalAdmins = await User.countDocuments(query);
    const admins = await User.find(query)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(limit);
    
    sendResponse(res, {
      data: { 
        admins,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalAdmins / limit),
          totalAdmins
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { username, email } = req.body;

    const admin = await User.findByIdAndUpdate(
      id, 
      { username, email }, 
      { new: true, runValidators: true }
    ).select('-password');

    if (!admin) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Admin not found');
    }

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      data: admin,
      message: 'Admin updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const changeAdminPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    const admin = await User.findById(id).select('+password');
    if (!admin) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Admin not found');
    }

    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Current password is incorrect');
    }

    admin.password = newPassword;
    await admin.save();

    sendResponse(res, {
      statusCode: HTTP_STATUS.OK,
      message: 'Admin password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};
