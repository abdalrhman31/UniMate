CREATE TABLE IF NOT EXISTS outlook_connections (
  user_id INT NOT NULL,
  email VARCHAR(255) NOT NULL,
  encrypted_refresh_token TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT outlook_connections_user_fk
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS outlook_oauth_states (
  state_hash CHAR(64) NOT NULL,
  user_id INT NOT NULL,
  expires_at DATETIME NOT NULL,
  PRIMARY KEY (state_hash),
  KEY outlook_oauth_states_expires (expires_at),
  CONSTRAINT outlook_oauth_states_user_fk
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS outlook_login_handoffs (
  code_hash CHAR(64) NOT NULL,
  user_id INT NOT NULL,
  expires_at DATETIME NOT NULL,
  PRIMARY KEY (code_hash),
  KEY outlook_login_handoffs_expires (expires_at),
  CONSTRAINT outlook_login_handoffs_user_fk
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS email_news_drafts (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  outlook_message_id VARCHAR(255) NOT NULL,
  sender_email VARCHAR(255) NOT NULL,
  title VARCHAR(200) NOT NULL,
  category VARCHAR(80) NOT NULL DEFAULT 'Announcements',
  date DATE NOT NULL,
  read_time VARCHAR(40) NOT NULL DEFAULT '2 min read',
  summary TEXT NOT NULL,
  source_url VARCHAR(1000) DEFAULT NULL,
  status ENUM('pending', 'published', 'rejected') NOT NULL DEFAULT 'pending',
  news_article_id VARCHAR(120) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY email_news_drafts_message (user_id, outlook_message_id),
  KEY email_news_drafts_status (status, created_at),
  CONSTRAINT email_news_drafts_user_fk
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
