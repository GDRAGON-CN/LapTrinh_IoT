-- =====================================================================
-- SEED DATA (Idempotent - INSERT IGNORE)
-- Thứ tự: Controller -> LEDs -> Sensors -> Admin Account
-- =====================================================================

-- 1. Seed ESP32 Controller (parent_id = NULL)
INSERT IGNORE INTO device_list (id, name, type, parent_id, gpio_pin, room, status, is_online)
VALUES (1, 'ESP32 Controller', 'CONTROLLER', NULL, NULL, 'Server Room', NULL, 0);

-- 2. Seed 3 LED Peripherals (parent_id = 1, is_online = NULL)
INSERT IGNORE INTO device_list (id, name, type, parent_id, gpio_pin, room, status, is_online)
VALUES 
  (2, 'LED 1', 'LED', 1, 2, 'Living Room', 'OFF', NULL),
  (3, 'LED 2', 'LED', 1, 5, 'Bedroom', 'OFF', NULL),
  (4, 'LED 3', 'LED', 1, 18, 'Kitchen', 'OFF', NULL);

-- 3. Seed 3 Sensors (controller_id = 1)
INSERT IGNORE INTO sensor_list (id, controller_id, name, type, unit, gpio_pin)
VALUES
  (1, 1, 'DHT11 Temperature', 'temperature', '°C', 16),
  (2, 1, 'DHT11 Humidity', 'humidity', '% RH', 16),
  (3, 1, 'LDR Light', 'light', 'ADC', 34);

-- 4. Seed Admin User ban đầu (Mật khẩu '123456' băm bằng bcrypt 10 rounds: $2a$10$wE9K2dO6XqZkJgG6J3k2Me1ZvZ5bN7i9bL4oZq5h7J8k9l0m1n2o3 - lưu ý người dùng nên đổi mật khẩu sau khi đăng nhập)
-- Hash bcrypt mẫu cho '123456' với salt chuẩn
INSERT IGNORE INTO users (id, name, email, password_hash, phone, github, figma, drawio, role)
VALUES (
  1, 
  'Giang (Admin)', 
  'giang@gmail.com', 
  '$2b$10$MCoqk5fnqRWE73Y1idvpHumwX8edGMzMNjdcmF2h.JH3H.WSg3MJK', 
  '0123 456 789', 
  'https://github.com/GDRAGON-CN', 
  'https://www.figma.com/file/smart-home', 
  'https://app.diagrams.net/#smart-home', 
  'ADMIN'
);
