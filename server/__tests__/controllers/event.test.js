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
        query: {}
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
        date: new Date()
      };
      
      req.body = eventData;
      req.validatedData.body = eventData;
      const mockEvent = { ...eventData, _id: 'mockId', images: [] };
      
      Event.create.mockResolvedValue(mockEvent);

      await createEvent(req, res, next);

      expect(Event.create).toHaveBeenCalledWith({
        ...eventData,
        images: []
      });
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: HTTP_STATUS.CREATED,
        message: 'Event created successfully',
        data: { event: mockEvent }
      }));
    });

    it('should create an event with images', async () => {
      const eventData = {
        title: 'Test Event',
        description: 'Test Description',
        date: new Date()
      };
      
      const mockFile1 = { filename: 'image1.jpg' };
      const mockFile2 = { filename: 'image2.jpg' };
      
      req.body = eventData;
      req.validatedData.body = eventData;
      req.files = [mockFile1, mockFile2];
      
      const mockImageInfo1 = { url: 'url1', path: 'path1' };
      const mockImageInfo2 = { url: 'url2', path: 'path2' };
      
      imageService.processImage.mockResolvedValueOnce(mockImageInfo1);
      imageService.processImage.mockResolvedValueOnce(mockImageInfo2);
      
      const mockEvent = { 
        ...eventData, 
        _id: 'mockId', 
        images: [mockImageInfo1, mockImageInfo2] 
      };
      
      Event.create.mockResolvedValue(mockEvent);

      await createEvent(req, res, next);

      expect(imageService.processImage).toHaveBeenCalledTimes(2);
      expect(imageService.processImage).toHaveBeenCalledWith(mockFile1);
      expect(imageService.processImage).toHaveBeenCalledWith(mockFile2);
      
      expect(Event.create).toHaveBeenCalledWith({
        ...eventData,
        images: [mockImageInfo1, mockImageInfo2]
      });
      
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: HTTP_STATUS.CREATED,
        message: 'Event created successfully',
        data: { event: mockEvent }
      }));
    });

    it('should handle image processing errors', async () => {
      const eventData = {
        title: 'Test Event',
        description: 'Test Description',
        date: new Date()
      };
      
      const mockFile1 = { filename: 'image1.jpg' };
      const mockFile2 = { filename: 'image2.jpg' };
      
      req.body = eventData;
      req.validatedData.body = eventData;
      req.files = [mockFile1, mockFile2];
      
      const mockError = new Error('Image processing failed');
      
      imageService.processImage.mockRejectedValueOnce(mockError);
      
      imageService.deleteImage.mockResolvedValue(null);

      await createEvent(req, res, next);

      expect(imageService.processImage).toHaveBeenCalledWith(mockFile1);
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
        { _id: 'event1', title: 'Test Event 1', category: 'conference', date: new Date('2023-06-15') },
        { _id: 'event2', title: 'Test Event 2', category: 'conference', date: new Date('2023-07-20') }
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

      Event.countDocuments.mockResolvedValue(mockEvents.length);
      Event.find.mockReturnThis();
      Event.skip.mockReturnThis();
      Event.limit.mockResolvedValue(mockEvents);

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
      const eventId = 'mockId';
      
      req.params = { id: eventId };
      
      const mockEvent = {
        _id: eventId,
        title: 'Test Event',
        description: 'Test Description'
      };

      Event.findById.mockResolvedValue(mockEvent);

      await getEvent(req, res, next);

      expect(Event.findById).toHaveBeenCalledWith(eventId);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        data: { event: mockEvent }
      }));
    });

    it('should handle event not found', async () => {
      const eventId = 'nonexistentId';
      
      req.params = { id: eventId };

      Event.findById.mockResolvedValue(null);

      await getEvent(req, res, next);

      expect(Event.findById).toHaveBeenCalledWith(eventId);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('updateEvent', () => {
    it('should update an event successfully', async () => {
      const eventId = 'mockId';
      const updateData = {
        title: 'Updated Event Title',
        description: 'Updated Description'
      };
      
      req.params = { id: eventId };
      req.validatedData.body = updateData;
      
      const mockUpdatedEvent = {
        _id: eventId,
        ...updateData
      };

      Event.findByIdAndUpdate.mockResolvedValue(mockUpdatedEvent);

      await updateEvent(req, res, next);

      expect(Event.findByIdAndUpdate).toHaveBeenCalledWith(
        eventId, 
        updateData, 
        { new: true, runValidators: true }
      );
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Event updated successfully',
        data: { event: mockUpdatedEvent }
      }));
    });

    it('should handle event not found during update', async () => {
      const eventId = 'nonexistentId';
      const updateData = {
        title: 'Updated Event Title'
      };
      
      req.params = { id: eventId };
      req.validatedData.body = updateData;

      Event.findByIdAndUpdate.mockResolvedValue(null);

      await updateEvent(req, res, next);

      expect(Event.findByIdAndUpdate).toHaveBeenCalledWith(
        eventId, 
        updateData, 
        { new: true, runValidators: true }
      );
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('deleteEvent', () => {
    it('should delete an event and its images', async () => {
      const eventId = 'mockId';
      const mockEvent = {
        _id: eventId,
        title: 'Test Event',
        images: [
          { url: 'url1', path: 'path1' },
          { url: 'url2', path: 'path2' }
        ]
      };

      req.params = { id: eventId };

      Event.findByIdAndDelete.mockResolvedValue(mockEvent);
      imageService.deleteImage.mockResolvedValue(null);

      await deleteEvent(req, res, next);

      expect(Event.findByIdAndDelete).toHaveBeenCalledWith(eventId);
      expect(imageService.deleteImage).toHaveBeenCalledTimes(2);
      expect(imageService.deleteImage).toHaveBeenCalledWith(mockEvent.images[0]);
      expect(imageService.deleteImage).toHaveBeenCalledWith(mockEvent.images[1]);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Event deleted successfully',
        data: { event: mockEvent }
      }));
    });

    it('should handle event not found during deletion', async () => {
      const eventId = 'nonexistentId';

      req.params = { id: eventId };

      Event.findByIdAndDelete.mockResolvedValue(null);

      await deleteEvent(req, res, next);

      expect(Event.findByIdAndDelete).toHaveBeenCalledWith(eventId);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
