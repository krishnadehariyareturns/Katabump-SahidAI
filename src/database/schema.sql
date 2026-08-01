-- Each row is one turn in a channel's shared conversation with the bot.
-- role: 'user' | 'assistant' | 'system'
-- For role='user', author_id/author_name identify who sent it (needed because
-- multiple humans can share one conversation thread in the same channel).
-- For role='assistant', author_id/author_name are NULL.
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  author_id TEXT,
  author_name TEXT,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Speeds up "fetch last N messages for this channel" and "clear this channel".
CREATE INDEX IF NOT EXISTS idx_messages_channel_created
  ON messages (channel_id, created_at);
