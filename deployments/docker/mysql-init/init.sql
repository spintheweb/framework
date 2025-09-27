-- Initialize sample schema and a table used by the example webbaselets
CREATE TABLE IF NOT EXISTS portal_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO portal_users (username, password_hash) VALUES
  ('admin', '$2b$12$exampleHashedPasswordReplaceMe');
