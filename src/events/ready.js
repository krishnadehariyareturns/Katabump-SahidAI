import createLogger from '../utils/logger.js';

const logger = createLogger('ReadyEvent');

export default {
  name: 'ready',
  once: true,
  execute(client) {
    logger.info(`Logged in as ${client.user.tag} — serving ${client.guilds.cache.size} guild(s)`);
  },
};
