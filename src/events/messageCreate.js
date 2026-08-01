import { handleMessage } from '../handlers/messageHandler.js';

export default {
  name: 'messageCreate',
  once: false,
  execute(client, message) {
    return handleMessage(client, message);
  },
};
