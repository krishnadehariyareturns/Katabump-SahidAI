import Database from 'better-sqlite3';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import config from '../config/config.js';
import createLogger from '../utils/logger.js';

const logger = createLogger('Database');
const __dirname = dirname(fileURLToPath(import.meta.url));

function ensureDataDirExists(dbPath) {
  const dir = dirname(resolve(dbPath));
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    logger.info(`Created data directory: ${dir}`);
  }
}

ensureDataDirExists(config.database.path);

const db = new Database(config.database.path);

// WAL improves concurrent read/write behavior, which matters once the bot
// is handling messages across many channels at once.
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schema = readFileSync(resolve(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

logger.info(`SQLite database ready at ${config.database.path}`);

export default db;
