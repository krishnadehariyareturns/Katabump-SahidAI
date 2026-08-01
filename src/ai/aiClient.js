import config from '../config/config.js';
import createLogger from '../utils/logger.js';
import { callModel } from './openrouter.js';

const logger = createLogger('AIClient');

/**
 * Sends `messages` to the first working model in config.openRouter.models,
 * falling back to the next on failure, timeout, or rate-limit.
 *
 * @param {Array<{role: string, content: string}>} messages
 * @returns {Promise<{content: string, model: string}>}
 * @throws {Error} if every model in the chain fails
 */
export async function generateReply(messages) {
  const errors = [];

  for (const model of config.openRouter.models) {
    try {
      logger.debug(`Attempting model: ${model}`);
      const content = await callModel(model, messages);
      logger.info(`Model succeeded: ${model}`);
      return { content, model };
    } catch (err) {
      logger.warn(`Model failed, falling back: ${model}`, err.message);
      errors.push(`${model}: ${err.message}`);
    }
  }

  throw new Error(
    `All configured AI models failed.\n${errors.join('\n')}`
  );
}

export default { generateReply };
