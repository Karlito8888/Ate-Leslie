import { connectDB } from '../../utils/database.js';
import { User } from '../../models/index.js';

export const command = 'list-admins';
export const description = 'List existing admin accounts';
export const builder = {};

export const handler = async () => {
  try {
    await connectDB();
    const admins = await User.find({ role: 'admin' }).select('-password');
    
    if (admins.length === 0) {
      console.log('No admin accounts found.');
      process.exit(0);
    }

    console.log(' Admin Accounts:');
    admins.forEach((admin, index) => {
      console.log(`
[Admin ${index + 1}]
- Username: ${admin.username}
- Email: ${admin.email}
- Name: ${admin.firstName} ${admin.lastName}
- Phone: ${admin.phoneNumber || 'N/A'}
      `);
    });

    process.exit(0);
  } catch (error) {
    console.error(' Failed to list admin accounts:', error);
    process.exit(1);
  }
};
