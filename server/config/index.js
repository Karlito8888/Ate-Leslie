export const config = {
    port: process.env.PORT || 5000,
    mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ateleslie',
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
    nodeEnv: process.env.NODE_ENV || 'development'
};
