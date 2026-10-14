-- =====================================================================
-- BẢNG 3: sensor_list
-- Quản lý các cảm biến (Temperature DHT11, Humidity DHT11, Light LDR)
-- =====================================================================

CREATE TABLE IF NOT EXISTS sensor_list (
  id              INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  controller_id   INT UNSIGNED     NOT NULL,           -- Khóa ngoại tham chiếu về CONTROLLER trong device_list
  name            VARCHAR(100)     NOT NULL,           -- 'DHT11 Temperature', 'DHT11 Humidity', 'LDR Light'
  type            ENUM('temperature','humidity','light') NOT NULL,
  unit            VARCHAR(20)      NOT NULL,           -- '°C', '% RH', 'ADC'
  gpio_pin        TINYINT UNSIGNED NOT NULL,           -- 16 (DHT11), 34 (LDR)
  created_at      DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sensor_controller_type (controller_id, type),
  CONSTRAINT fk_sensor_controller FOREIGN KEY (controller_id) 
    REFERENCES device_list (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
