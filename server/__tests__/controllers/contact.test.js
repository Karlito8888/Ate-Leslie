import { jest } from '@jest/globals';
import { Contact } from '../../models/index.js';
import { createContact, getContacts, updateContactStatus } from '../../controllers/contact/index.js';
import { HTTP_STATUS } from '../../constants/http.js';

// Mock Contact model
jest.mock('../../models/index.js');

describe('Contact Controller', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      validatedData: {
        query: {},
        body: {}
      }
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

  describe('createContact', () => {
    it('should create a new contact successfully', async () => {
      const contactData = {
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Test message'
      };
      
      req.body = contactData;
      req.validatedData.body = contactData;
      
      const mockContact = { ...contactData, _id: 'mockId' };
      Contact.create = jest.fn().mockImplementation(() => Promise.resolve(mockContact));

      await createContact(req, res, next);

      expect(Contact.create).toHaveBeenCalledWith(contactData);
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.CREATED);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Message sent successfully',
        data: { contact: mockContact }
      }));
    });

    it('should handle creation error', async () => {
      const contactData = {
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Test message'
      };
      
      req.body = contactData;
      req.validatedData.body = contactData;
      
      const mockError = new Error('Creation failed');
      Contact.create = jest.fn().mockImplementation(() => Promise.reject(mockError));

      await createContact(req, res, next);

      expect(Contact.create).toHaveBeenCalledWith(contactData);
      expect(next).toHaveBeenCalledWith(mockError);
    });
  });

  describe('getContacts', () => {
    it('should retrieve contacts with pagination', async () => {
      req.validatedData.query = {
        page: 1,
        limit: 10,
        search: 'test',
        status: 'pending'
      };
      
      const mockContacts = [
        { _id: 'contact1', name: 'John', email: 'john@example.com', status: 'pending' },
        { _id: 'contact2', name: 'Jane', email: 'jane@example.com', status: 'pending' }
      ];

      const mockQuery = {
        $or: [
          { name: { $regex: 'test', $options: 'i' } },
          { email: { $regex: 'test', $options: 'i' } },
          { subject: { $regex: 'test', $options: 'i' } }
        ],
        status: 'pending'
      };

      Contact.countDocuments = jest.fn().mockImplementation(() => Promise.resolve(mockContacts.length));
      Contact.find = jest.fn().mockReturnThis();
      Contact.sort = jest.fn().mockReturnThis();
      Contact.skip = jest.fn().mockReturnThis();
      Contact.limit = jest.fn().mockImplementation(() => Promise.resolve(mockContacts));

      await getContacts(req, res, next);

      expect(Contact.countDocuments).toHaveBeenCalledWith(mockQuery);
      expect(Contact.find).toHaveBeenCalledWith(mockQuery);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        data: { 
          contacts: mockContacts,
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalContacts: 2
          }
        }
      }));
    });
  });

  describe('updateContactStatus', () => {
    it('should update contact status successfully', async () => {
      const contactId = 'mockContactId';
      const newStatus = 'resolved';

      req.params = { id: contactId };
      req.validatedData.body = { status: newStatus };

      const mockContact = {
        _id: contactId,
        name: 'John Doe',
        email: 'john@example.com',
        status: newStatus
      };

      Contact.findByIdAndUpdate = jest.fn().mockImplementation(() => Promise.resolve(mockContact));

      await updateContactStatus(req, res, next);

      expect(Contact.findByIdAndUpdate).toHaveBeenCalledWith(
        contactId,
        { status: newStatus },
        { new: true, runValidators: true }
      );
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Contact status updated successfully',
        data: { contact: mockContact }
      }));
    });

    it('should handle contact not found', async () => {
      const contactId = 'mockContactId';
      const newStatus = 'resolved';

      req.params = { id: contactId };
      req.validatedData.body = { status: newStatus };

      Contact.findByIdAndUpdate = jest.fn().mockImplementation(() => Promise.resolve(null));

      await updateContactStatus(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
