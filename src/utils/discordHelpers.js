const DISCORD_MAX_MESSAGE_LENGTH = 2000;

/**
 * Splits `text` into chunks that fit Discord's message length limit,
 * preferring to break on paragraph/line boundaries so formatting
 * (code blocks, lists) doesn't get sliced mid-line where avoidable.
 */
export function splitMessage(text, maxLength = DISCORD_MAX_MESSAGE_LENGTH) {
  if (text.length <= maxLength) return [text];

  const chunks = [];
  let remaining = text;

  while (remaining.length > maxLength) {
    let splitIndex = remaining.lastIndexOf('\n', maxLength);
    if (splitIndex <= 0) splitIndex = remaining.lastIndexOf(' ', maxLength);
    if (splitIndex <= 0) splitIndex = maxLength;

    chunks.push(remaining.slice(0, splitIndex));
    remaining = remaining.slice(splitIndex).trimStart();
  }

  if (remaining.length > 0) chunks.push(remaining);
  return chunks;
}

export default { splitMessage };
