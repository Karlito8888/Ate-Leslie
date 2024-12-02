import { jest } from '@jest/globals';
import { User } from '../../models/index.js';
import { getUsers, getAdmins, updateAdmin, changeAdminPassword } from '../../controllers/user/index.js';
import { HTTP_STATUS } from '../../constants/http.js';

// Mock User model
jest.mock('../../models/index.js');

describe('User Controller', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      params: {},
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUsers', () => {
    it('should return all users with role user', async () => {
      const mockUsers = [
        { _id: '1', username: 'user1', role: 'user' },
        { _id: '2', username: 'user2', role: 'user' }
      ];

      User.find.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUsers)
      });

      await getUsers(req, res, next);

      expect(User.find).toHaveBeenCalledWith({ role: 'user' });
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        data: { users: mockUsers }
      }));
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      User.find.mockReturnValue({
        select: jest.fn().mockRejectedValue(error)
      });

      await getUsers(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getAdmins', () => {
    it('should return all users with role admin', async () => {
      const mockAdmins = [
        { _id: '1', username: 'admin1', role: 'admin' },
        { _id: '2', username: 'admin2', role: 'admin' }
      ];

      User.find.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockAdmins)
      });

      await getAdmins(req, res, next);

      expect(User.find).toHaveBeenCalledWith({ role: 'admin' });
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        data: { admins: mockAdmins }
      }));
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      User.find.mockReturnValue({
        select: jest.fn().mockRejectedValue(error)
      });

      await getAdmins(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('updateAdmin', () => {
    it('should update admin successfully', async () => {
      const adminId = 'mockAdminId';
      const updateData = {
        username: 'updatedAdmin'
      };
      
      req.params.id = adminId;
      req.body = updateData;
      
      const mockUpdatedAdmin = {
        _id: adminId,
        ...updateData,
        role: 'admin'
      };

      User.findOneAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUpdatedAdmin)
      });

      await updateAdmin(req, res, next);

      expect(User.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: adminId, role: 'admin' },
        { $set: updateData },
        { new: true, runValidators: true }
      );
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Admin updated successfully',
        data: { admin: mockUpdatedAdmin }
      }));
    });

    it('should handle non-existent admin', async () => {
      req.params.id = 'nonexistentId';
      User.findOneAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      await updateAdmin(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Admin not found'
      }));
    });
  });

  describe('changeAdminPassword', () => {
    it('should change admin password successfully', async () => {
      const adminId = 'mockAdminId';
      const passwordData = {
        currentPassword: 'oldpass',
        newPassword: 'newpass'
      };
      
      req.params.id = adminId;
      req.body = passwordData;
      
      const mockAdmin = {
        _id: adminId,
        role: 'admin',
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true)
      };

      User.findOne.mockResolvedValue(mockAdmin);

      await changeAdminPassword(req, res, next);

      expect(User.findOne).toHaveBeenCalledWith({ _id: adminId, role: 'admin' });
      expect(mockAdmin.comparePassword).toHaveBeenCalledWith(passwordData.currentPassword);
      expect(mockAdmin.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Password updated successfully'
      }));
    });

    it('should handle incorrect current password', async () => {
      const adminId = 'mockAdminId';
      const passwordData = {
        currentPassword: 'wrongpass',
        newPassword: 'newpass'
      };
      
      req.params.id = adminId;
      req.body = passwordData;
      
      const mockAdmin = {
        _id: adminId,
        role: 'admin',
        comparePassword: jest.fn().mockResolvedValue(false)
      };

      User.findOne.mockResolvedValue(mockAdmin);

      await changeAdminPassword(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: HTTP_STATUS.UNAUTHORIZED,
        message: 'Current password is incorrect'
      }));
    });

    it('should handle non-existent admin', async () => {
      req.params.id = 'nonexistentId';
      User.findOne.mockResolvedValue(null);

      await changeAdminPassword(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Admin not found'
      }));
    });
  });
});
