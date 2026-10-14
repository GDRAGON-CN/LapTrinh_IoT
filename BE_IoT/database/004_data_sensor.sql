-- =====================================================================
-- BẢNG 4: data_sensor
-- Lưu trữ chuỗi thời gian dữ liệu đo thực tế từ các cảm biến
-- =====================================================================

CREATE TABLE IF NOT EXISTS data_sensor (
  id              BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  sensor_id       INT UNSIGNED     NOT NULL,
  value           DECIMAL(10,2)    NOT NULL,
  recorded_at     DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_ds_sensor FOREIGN KEY (sensor_id) 
    REFERENCES sensor_list (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_ds_sensor_time (sensor_id, recorded_at DESC),
  INDEX idx_ds_recorded_at (recorded_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
