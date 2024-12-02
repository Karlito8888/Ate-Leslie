import { connectDB } from '../../utils/database.js';
import { createAdmins } from '../../utils/auth.js';

export const command = 'create-admin';
export const description = 'Create default admin accounts';
export const builder = {
  force: {
    alias: 'f',
    type: 'boolean',
    description: 'Force reset existing admin accounts',
    default: false
  }
};

export const handler = async (argv) => {
  try {
    const forceReset = argv.force;
    console.log(`Initializing admin creation process (Force reset: ${forceReset})`);
    
    await connectDB();
    await createAdmins(forceReset);
    
    console.log(' Admin creation process completed successfully');
    process.exit(0);
  } catch (error) {
    console.error(' Failed to create admin accounts:', error);
    process.exit(1);
  }
};
