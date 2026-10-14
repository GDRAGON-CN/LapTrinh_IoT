-- =====================================================================
-- BẢNG 5: action_device
-- Lưu vết lịch sử thao tác bật/tắt thiết bị của người dùng (Audit Trail)
-- =====================================================================

CREATE TABLE IF NOT EXISTS action_device (
  id                  BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  request_id          VARCHAR(36)      NOT NULL,           -- UUID của từng lệnh con
  group_request_id    VARCHAR(36)      DEFAULT NULL,       -- UUID nhóm chung cho 'all ON/OFF' hoặc 'random'
  user_id             INT UNSIGNED     NOT NULL,
  device_id           INT UNSIGNED     NOT NULL,           -- Chỉ tham chiếu đến thiết bị type = 'LED'
  action              ENUM('ON','OFF') NOT NULL,
  status              ENUM('LOADING','FINISH','FAILED') NOT NULL DEFAULT 'LOADING',
  error_message       VARCHAR(500)     DEFAULT NULL,
  created_at          DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at         DATETIME         DEFAULT NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_ad_user FOREIGN KEY (user_id) 
    REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_ad_device FOREIGN KEY (device_id) 
    REFERENCES device_list (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  UNIQUE KEY uq_ad_request (request_id),
  INDEX idx_ad_group (group_request_id),
  INDEX idx_ad_status (status),
  INDEX idx_ad_user_time (user_id, created_at DESC),
  INDEX idx_ad_device_time (device_id, created_at DESC),
  INDEX idx_ad_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
