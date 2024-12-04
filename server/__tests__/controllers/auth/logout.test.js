import { jest } from '@jest/globals';
import { logout } from '../../../controllers/auth/index.js';
import { HTTP_STATUS } from '../../../constants/http.js';

describe('logout', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      clearCookie: jest.fn(),
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should clear the token cookie and return success message', async () => {
    await logout(req, res);

    expect(res.clearCookie).toHaveBeenCalledWith('token');
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Logout successful'
    }));
  });

  it('should set the response status to OK', async () => {
    await logout(req, res);

    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.OK);
  });
});
