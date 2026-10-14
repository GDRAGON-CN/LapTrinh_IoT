-- =====================================================================
-- BẢNG 2: device_list
-- Quản lý ESP32 Controller và 3 LED (Living Room, Bedroom, Kitchen)
-- ESP32 là Controller cha; 3 LED là thiết bị con.
-- =====================================================================

CREATE TABLE IF NOT EXISTS device_list (
  id              INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  name            VARCHAR(100)     NOT NULL,           -- 'ESP32 Controller', 'LED 1', 'LED 2', 'LED 3'
  type            ENUM('CONTROLLER','LED') NOT NULL,
  parent_id       INT UNSIGNED     DEFAULT NULL,       -- Khóa ngoại tự tham chiếu: LED tham chiếu về CONTROLLER id
  gpio_pin        TINYINT UNSIGNED DEFAULT NULL,       -- NULL cho CONTROLLER; 2, 5, 18 cho LED
  room            VARCHAR(100)     DEFAULT NULL,       -- 'Server Room', 'Living Room', 'Bedroom', 'Kitchen'
  status          ENUM('ON','OFF') DEFAULT NULL,       -- NULL cho CONTROLLER; 'ON' hoặc 'OFF' cho LED
  is_online       TINYINT(1)       DEFAULT NULL,       -- CHỈ CÓ Ý NGHĨA VỚI CONTROLLER (1: online, 0: offline). Với LED để NULL
  created_at      DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_device_gpio (gpio_pin),
  CONSTRAINT fk_device_parent FOREIGN KEY (parent_id) 
    REFERENCES device_list (id) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_device_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
