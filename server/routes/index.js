import testRoutes from './api/v1/test.routes.js';
import userRoutes from './api/v1/user.routes.js';
import authRoutes from './api/v1/auth.routes.js';

export const configureRoutes = (app) => {
  app.get('/', (req, res) => {
    res.json({ message: 'API is running' });
  });
  
  app.use('/api/v1/tests', testRoutes);
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/auth', authRoutes);
};
