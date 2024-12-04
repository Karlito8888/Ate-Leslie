import { jest } from '@jest/globals';
import { Event } from '../../models/index.js';
import { imageService } from '../../utils/image.js';
import { createEvent, getEvents, getEvent, updateEvent, deleteEvent } from '../../controllers/event/index.js';
import { HTTP_STATUS } from '../../constants/http.js';

// Mock dependencies
jest.mock('../../models/index.js');
jest.mock('../../utils/image.js', () => ({
  processImage: jest.fn(),
  deleteImage: jest.fn()
}));

describe('Event Controller', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      files: [],
      validatedData: {
        body: {},
        query: {},
        params: {}
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

  describe('createEvent', () => {
    it('should create an event without images', async () => {
      const eventData = {
        title: 'Test Event',
        description: 'Test Description',
        startDate: new Date(),
        endDate: new Date(),
        location: 'Test Location',
        category: 'Test Category'
      };
      
      req.validatedData.body = eventData;
      req.files = [];

      const mockEvent = { ...eventData, _id: 'mockId', images: [] };
      Event.create = jest.fn().mockImplementation(() => Promise.resolve(mockEvent));

      await createEvent(req, res, next);

      expect(Event.create).toHaveBeenCalledWith(expect.objectContaining(eventData));
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.CREATED);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Event created successfully',
        data: { event: mockEvent }
      }));
    });

    it('should create an event with images', async () => {
      const eventData = {
        title: 'Test Event',
        description: 'Test Description',
        startDate: new Date(),
        endDate: new Date(),
        location: 'Test Location',
        category: 'Test Category'
      };
      
      const mockFile1 = { buffer: Buffer.from('image1'), originalname: 'image1.jpg' };
      const mockFile2 = { buffer: Buffer.from('image2'), originalname: 'image2.jpg' };
      
      req.validatedData.body = eventData;
      req.files = [mockFile1, mockFile2];

      const mockImageInfo1 = { url: 'url1', path: 'path1' };
      const mockImageInfo2 = { url: 'url2', path: 'path2' };

      imageService.processImage = jest.fn()
        .mockImplementationOnce(() => Promise.resolve(mockImageInfo1))
        .mockImplementationOnce(() => Promise.resolve(mockImageInfo2));

      const mockEvent = { 
        ...eventData, 
        _id: 'mockId', 
        images: [mockImageInfo1, mockImageInfo2] 
      };
      Event.create = jest.fn().mockImplementation(() => Promise.resolve(mockEvent));

      await createEvent(req, res, next);

      expect(imageService.processImage).toHaveBeenCalledTimes(2);
      expect(Event.create).toHaveBeenCalledWith(expect.objectContaining({
        ...eventData,
        images: [mockImageInfo1, mockImageInfo2]
      }));
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.CREATED);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Event created successfully',
        data: { event: mockEvent }
      }));
    });

    it('should handle image processing errors', async () => {
      const eventData = {
        title: 'Test Event',
        description: 'Test Description',
        startDate: new Date(),
        endDate: new Date(),
        location: 'Test Location',
        category: 'Test Category'
      };
      
      const mockFile1 = { buffer: Buffer.from('image1'), originalname: 'image1.jpg' };
      const mockFile2 = { buffer: Buffer.from('image2'), originalname: 'image2.jpg' };
      
      req.validatedData.body = eventData;
      req.files = [mockFile1, mockFile2];

      const mockError = new Error('Image processing failed');

      const mockImageInfo1 = { url: 'url1', path: 'path1' };

      imageService.processImage = jest.fn()
        .mockImplementationOnce(() => Promise.resolve(mockImageInfo1))
        .mockImplementationOnce(() => Promise.reject(mockError));

      imageService.deleteImage = jest.fn().mockImplementation(() => Promise.resolve(null));

      await createEvent(req, res, next);

      expect(imageService.processImage).toHaveBeenCalledTimes(2);
      expect(imageService.deleteImage).toHaveBeenCalledWith(mockFile1);
      expect(imageService.deleteImage).toHaveBeenCalledWith(mockFile2);
      expect(next).toHaveBeenCalledWith(mockError);
    });
  });

  describe('getEvents', () => {
    it('should retrieve events with pagination and filters', async () => {
      req.validatedData.query = {
        page: 1,
        limit: 10,
        search: 'test',
        category: 'conference',
        startDate: '2023-01-01',
        endDate: '2023-12-31'
      };
      
      const mockEvents = [
        { _id: 'event1', title: 'Test Event 1', category: 'conference' },
        { _id: 'event2', title: 'Test Event 2', category: 'conference' }
      ];

      const mockQuery = {
        $or: [
          { title: { $regex: 'test', $options: 'i' } },
          { description: { $regex: 'test', $options: 'i' } }
        ],
        category: 'conference',
        date: {
          $gte: new Date('2023-01-01'),
          $lte: new Date('2023-12-31')
        }
      };

      Event.countDocuments = jest.fn().mockResolvedValue(mockEvents.length);
      Event.find = jest.fn().mockReturnThis();
      Event.sort = jest.fn().mockReturnThis();
      Event.select = jest.fn().mockReturnThis();
      Event.skip = jest.fn().mockReturnThis();
      Event.limit = jest.fn().mockResolvedValue(mockEvents);

      await getEvents(req, res, next);

      expect(Event.countDocuments).toHaveBeenCalledWith(mockQuery);
      expect(Event.find).toHaveBeenCalledWith(mockQuery);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        data: { 
          events: mockEvents,
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalEvents: 2
          }
        }
      }));
    });
  });

  describe('getEvent', () => {
    it('should retrieve a single event by ID', async () => {
      const eventId = 'mockEventId';
      req.validatedData.params = { id: eventId };

      const mockEvent = {
        _id: eventId,
        title: 'Test Event',
        description: 'Test Description',
        images: [{ url: 'url1' }, { url: 'url2' }]
      };

      Event.findById = jest.fn().mockResolvedValue(mockEvent);

      await getEvent(req, res, next);

      expect(Event.findById).toHaveBeenCalledWith(eventId);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        data: { event: mockEvent }
      }));
    });

    it('should handle event not found', async () => {
      const eventId = 'mockEventId';
      req.validatedData.params = { id: eventId };

      Event.findById = jest.fn().mockResolvedValue(null);

      await getEvent(req, res, next);

      expect(Event.findById).toHaveBeenCalledWith(eventId);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('updateEvent', () => {
    it('should update an event successfully', async () => {
      const eventId = 'mockEventId';
      const updateData = {
        title: 'Updated Event',
        description: 'Updated Description'
      };
      
      req.validatedData.params = { id: eventId };
      req.validatedData.body = updateData;
      req.files = [];

      const existingEvent = {
        _id: eventId,
        title: 'Original Event',
        description: 'Original Description',
        images: [],
        save: jest.fn().mockResolvedValue(true)
      };

      Event.findById = jest.fn().mockResolvedValue(existingEvent);

      await updateEvent(req, res, next);

      expect(Event.findById).toHaveBeenCalledWith(eventId);
      expect(existingEvent.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Event updated successfully',
        data: { event: expect.objectContaining(updateData) }
      }));
    });

    it('should handle event not found during update', async () => {
      const eventId = 'mockEventId';
      const updateData = {
        title: 'Updated Event',
        description: 'Updated Description'
      };
      
      req.validatedData.params = { id: eventId };
      req.validatedData.body = updateData;
      req.files = [];

      Event.findById = jest.fn().mockResolvedValue(null);

      await updateEvent(req, res, next);

      expect(Event.findById).toHaveBeenCalledWith(eventId);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('deleteEvent', () => {
    it('should delete an event and its images', async () => {
      const eventId = 'mockEventId';
      const mockEvent = {
        _id: eventId,
        images: [
          { path: 'path1' },
          { path: 'path2' }
        ],
        remove: jest.fn().mockResolvedValue(true)
      };

      req.validatedData.params = { id: eventId };

      Event.findById = jest.fn().mockResolvedValue(mockEvent);
      imageService.deleteImage = jest.fn().mockResolvedValue(true);

      await deleteEvent(req, res, next);

      expect(Event.findById).toHaveBeenCalledWith(eventId);
      expect(imageService.deleteImage).toHaveBeenCalledTimes(2);
      expect(imageService.deleteImage).toHaveBeenCalledWith(mockEvent.images[0]);
      expect(imageService.deleteImage).toHaveBeenCalledWith(mockEvent.images[1]);
      expect(mockEvent.remove).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Event deleted successfully'
      }));
    });

    it('should handle event not found during deletion', async () => {
      const eventId = 'mockEventId';
      
      req.validatedData.params = { id: eventId };

      Event.findById = jest.fn().mockResolvedValue(null);

      await deleteEvent(req, res, next);

      expect(Event.findById).toHaveBeenCalledWith(eventId);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
