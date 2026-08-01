import config from '../config/config.js';
import createLogger from '../utils/logger.js';

const logger = createLogger('OpenRouter');

/**
 * Calls a single OpenRouter model with the given chat messages.
 * Throws on HTTP error, timeout, or empty response so the caller
 * (aiClient.js) can decide to fall back to the next model.
 *
 * @param {string} model - OpenRouter model slug, e.g. 'openai/gpt-oss-120b:free'
 * @param {Array<{role: string, content: string}>} messages
 * @returns {Promise<string>} the assistant's reply text
 */
export async function callModel(model, messages) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.openRouter.requestTimeoutMs);

  try {
    const response = await fetch(config.openRouter.baseUrl, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.openRouter.apiKey}`,
        // Optional headers OpenRouter uses for attribution / dashboard stats.
        ...(config.openRouter.siteUrl ? { 'HTTP-Referer': config.openRouter.siteUrl } : {}),
        ...(config.openRouter.appName ? { 'X-Title': config.openRouter.appName } : {}),
      },
      body: JSON.stringify({
        model,
        messages,
      }),
    });

    if (!response.ok) {
      const bodyText = await response.text().catch(() => '');
      throw new Error(
        `OpenRouter request failed for model "${model}": ${response.status} ${response.statusText} — ${bodyText.slice(0, 300)}`
      );
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content || !content.trim()) {
      throw new Error(`Model "${model}" returned an empty response.`);
    }

    return content.trim();
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`Model "${model}" timed out after ${config.openRouter.requestTimeoutMs}ms.`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export default { callModel };
