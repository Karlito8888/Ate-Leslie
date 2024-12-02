#!/usr/bin/env node

import dotenv from "dotenv";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

// Charger les variables d'environnement
dotenv.config();

// Importer les commandes
import * as createAdmin from "./commands/createAdmin.js";
import * as listAdmins from "./commands/listAdmins.js";

// Configurer yargs
yargs(hideBin(process.argv))
  .command(createAdmin)
  .command(listAdmins)
  .demandCommand(1, "You need to specify a command")
  .help()
  .alias("h", "help")
  .version(false)
  .parse();
