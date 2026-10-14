-- =====================================================================
-- BẢNG 1: users
-- Lưu trữ tài khoản người dùng, băm mật khẩu bằng bcrypt.
-- =====================================================================

CREATE TABLE IF NOT EXISTS users (
  id              INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  name            VARCHAR(100)     NOT NULL,
  email           VARCHAR(150)     NOT NULL,
  password_hash   VARCHAR(255)     NOT NULL,
  phone           VARCHAR(20)      DEFAULT NULL,
  github          VARCHAR(500)     DEFAULT NULL,
  figma           VARCHAR(500)     DEFAULT NULL,
  drawio          VARCHAR(500)     DEFAULT NULL,
  role            ENUM('USER','ADMIN') NOT NULL DEFAULT 'USER',
  created_at      DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
