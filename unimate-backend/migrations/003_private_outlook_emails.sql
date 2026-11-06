ALTER TABLE outlook_connections
  ADD COLUMN inbox_delta_link TEXT DEFAULT NULL,
  ADD COLUMN inbox_next_link TEXT DEFAULT NULL,
  ADD COLUMN sentitems_delta_link TEXT DEFAULT NULL,
  ADD COLUMN sentitems_next_link TEXT DEFAULT NULL;

ALTER TABLE email_news_drafts
  DROP INDEX email_news_drafts_message,
  ADD COLUMN source_folder ENUM('inbox', 'sentitems') NOT NULL DEFAULT 'sentitems' AFTER outlook_message_id,
  MODIFY status ENUM('private', 'pending', 'published', 'rejected') NOT NULL DEFAULT 'private',
  ADD UNIQUE KEY email_news_drafts_message (user_id, source_folder, outlook_message_id);
