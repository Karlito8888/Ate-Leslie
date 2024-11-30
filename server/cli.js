import { connectDB, createAdmins } from './utils.js';

const args = process.argv.slice(2);
const command = args[0];

const commands = {
  'create-admin': async (force = false) => {
    try {
      await connectDB();
      await createAdmins(force);
      process.exit(0);
    } catch (error) {
      console.error('Failed to create admin:', error);
      process.exit(1);
    }
  },
  'help': () => {
    console.log(`
Available commands:
  create-admin [--force]  Create default admin account
                         Use --force to reset existing admin accounts
  help                   Show this help message
    `);
    process.exit(0);
  }
};

if (!command || !commands[command]) {
  console.error('Invalid command. Use "help" to see available commands.');
  process.exit(1);
}

const force = args.includes('--force');
commands[command](force);
