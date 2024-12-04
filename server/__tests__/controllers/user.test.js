import { jest } from '@jest/globals';
import { userController } from '../../controllers/index.js';
import { HTTP_STATUS } from '../../constants/http.js';
import { responseHelpers } from '../../utils/response.js';
import * as responseHelpersModule from '../../utils/response.js';
import { ApiError } from '../../utils/error.js';
import { User } from '../../models/index.js';

// Mock User model methods with jest.spyOn
beforeEach(() => {
  jest.spyOn(User, 'find').mockReturnValue({
    select: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    exec: jest.fn()
  });
  jest.spyOn(User, 'findById').mockReturnValue({
    select: jest.fn().mockReturnThis(),
    exec: jest.fn()
  });
  jest.spyOn(User, 'findByIdAndUpdate').mockReturnValue({
    exec: jest.fn()
  });
  jest.spyOn(User, 'countDocuments').mockReturnValue({
    exec: jest.fn()
  });

  // Reset all mocks
  jest.clearAllMocks();
});

// Mock responseHelpers
jest.mock('../../utils/response.js', () => ({
  __esModule: true,
  responseHelpers: {
    sendResponse: jest.fn(),
    asyncHandler: (fn) => fn,
    sendError: jest.fn(),
    paginate: jest.fn()
  }
}));

describe('User Controller', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.spyOn(responseHelpers, 'sendResponse');
    jest.spyOn(User, 'find').mockReturnValue({
      select: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([
        { _id: '1', username: 'user1', role: 'user' },
        { _id: '2', username: 'user2', role: 'user' }
      ])
    });
    jest.spyOn(User, 'countDocuments').mockResolvedValue(2);

    jest.clearAllMocks();

    req = {
      params: {},
      body: {},
      validatedData: { query: { page: 1, limit: 10 } }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUsers', () => {
    it.only('should return all users with role user', async () => {
      console.log('Test started: should return all users with role user');

      await userController.getUsers(req, res, next);

      console.log('User.find called with:', User.find.mock.calls);
      console.log('User.countDocuments called with:', User.countDocuments.mock.calls);

      expect(User.find).toHaveBeenCalledWith({ role: 'user' });
      expect(User.countDocuments).toHaveBeenCalledWith({ role: 'user' });
      expect(responseHelpers.sendResponse).toHaveBeenCalledWith(
        res,
        expect.objectContaining({
          data: expect.objectContaining({
            users: [
              { _id: '1', username: 'user1', role: 'user' },
              { _id: '2', username: 'user2', role: 'user' }
            ],
            pagination: expect.objectContaining({
              currentPage: 1,
              totalPages: 1,
              totalUsers: 2
            })
          })
        })
      );
    });

    it('should return users with search query', async () => {
      const mockUsers = [
        { _id: '1', username: 'user1', role: 'user', email: 'user1@test.com' }
      ];

      req.validatedData.query = { page: 1, limit: 10, search: 'user1' };

      User.countDocuments().exec.mockResolvedValue(mockUsers.length);
      User.find().limit().exec.mockResolvedValue(mockUsers);

      await userController.getUsers(req, res, next);

      expect(User.find).toHaveBeenCalledWith({ 
        role: 'user',
        $or: [
          { email: { $regex: 'user1', $options: 'i' } },
          { name: { $regex: 'user1', $options: 'i' } }
        ]
      });
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      User.countDocuments().exec.mockRejectedValue(error);

      await userController.getUsers(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getAdmins', () => {
    it('should return all users with role admin', async () => {
      const mockAdmins = [
        { _id: '1', username: 'admin1', role: 'admin' },
        { _id: '2', username: 'admin2', role: 'admin' }
      ];

      req.validatedData.query = { page: 1, limit: 10 };

      User.countDocuments().exec.mockResolvedValue(mockAdmins.length);
      User.find().limit().exec.mockResolvedValue(mockAdmins);

      await userController.getAdmins(req, res, next);

      expect(User.find).toHaveBeenCalledWith({ role: 'admin' });
      expect(responseHelpers.sendResponse).toHaveBeenCalledWith(
        res, 
        expect.objectContaining({
          data: expect.objectContaining({
            admins: mockAdmins,
            pagination: expect.objectContaining({
              currentPage: 1,
              totalPages: 1,
              totalAdmins: mockAdmins.length
            })
          })
        })
      );
    });

    it('should return admins with search query', async () => {
      const searchQuery = 'admin1';
      const mockAdmin = {
        _id: '1',
        username: 'admin1',
        role: 'admin',
        email: 'admin1@test.com'
      };

      req.validatedData.query = { page: 1, limit: 10, search: searchQuery };

      User.countDocuments().exec.mockResolvedValue(1);
      User.find().limit().exec.mockResolvedValue([mockAdmin]);

      await userController.getAdmins(req, res, next);

      expect(User.find).toHaveBeenCalledWith({
        role: 'admin',
        $or: [
          { email: { $regex: searchQuery, $options: 'i' } },
          { name: { $regex: searchQuery, $options: 'i' } }
        ]
      });

      expect(responseHelpers.sendResponse).toHaveBeenCalledWith(
        res,
        expect.objectContaining({
          data: expect.objectContaining({
            admins: [mockAdmin],
            pagination: expect.objectContaining({
              currentPage: 1,
              totalPages: 1,
              totalAdmins: 1
            })
          })
        })
      );
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      User.find().limit().exec.mockRejectedValue(error);

      await userController.getAdmins(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('updateAdmin', () => {
    it('should update admin successfully', async () => {
      const adminId = 'mockAdminId';
      const updateData = {
        username: 'updatedAdmin',
        email: 'updated@test.com'
      };
      const updatedAdmin = {
        _id: adminId,
        ...updateData,
        role: 'admin'
      };

      req.params = { id: adminId };
      req.validatedData = { body: updateData };

      User.findByIdAndUpdate().exec.mockResolvedValue(updatedAdmin);

      await userController.updateAdmin(req, res, next);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        adminId,
        updateData,
        { new: true, runValidators: true }
      );

      expect(responseHelpers.sendResponse).toHaveBeenCalledWith(
        res,
        expect.objectContaining({
          statusCode: HTTP_STATUS.OK,
          message: 'Admin updated successfully',
          data: updatedAdmin
        })
      );
    });

    it('should handle non-existent admin', async () => {
      req.params = { id: 'nonexistentId' };
      User.findByIdAndUpdate().exec.mockResolvedValue(null);

      await userController.updateAdmin(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.any(ApiError)
      );
    });
  });

  describe('changeAdminPassword', () => {
    it('should change admin password successfully', async () => {
      const adminId = 'mockAdminId';
      const passwordData = {
        currentPassword: 'oldPassword',
        newPassword: 'newPassword'
      };

      const mockAdmin = {
        _id: adminId,
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true)
      };

      req.params = { id: adminId };
      req.validatedData = { body: passwordData };

      User.findById().exec.mockResolvedValue(mockAdmin);

      await userController.changeAdminPassword(req, res, next);

      expect(User.findById).toHaveBeenCalledWith(adminId);
      expect(mockAdmin.comparePassword).toHaveBeenCalledWith(passwordData.currentPassword);
      expect(mockAdmin.save).toHaveBeenCalled();
      expect(responseHelpers.sendResponse).toHaveBeenCalledWith(
        res,
        expect.objectContaining({
          statusCode: HTTP_STATUS.OK,
          message: 'Admin password changed successfully'
        })
      );
    });

    it('should handle incorrect current password', async () => {
      const adminId = 'mockAdminId';
      const mockAdmin = {
        _id: adminId,
        comparePassword: jest.fn().mockResolvedValue(false)
      };

      req.params = { id: adminId };
      User.findById().exec.mockResolvedValue(mockAdmin);

      await userController.changeAdminPassword(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.any(ApiError)
      );
    });

    it('should handle non-existent admin', async () => {
      req.params = { id: 'nonexistentId' };
      User.findById().exec.mockResolvedValue(null);

      await userController.changeAdminPassword(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.any(ApiError)
      );
    });
  });
});
