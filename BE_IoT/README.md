# HỆ THỐNG IOT SMART HOME — BACKEND SERVICE & HƯỚNG DẪN VẬN HÀNH

Tài liệu hướng dẫn triển khai và tích hợp cho đồ án môn học IoT Smart Home.

---

## 1. KIẾN TRÚC HỆ THỐNG
```
┌─────────────────────────────────┐
│     Frontend (React + Vite)     │ (Port 5173)
└──────────────┬──────────────────┘
               │ REST API & Socket.IO
               ▼
┌─────────────────────────────────┐
│     Backend (Node.js/Express)   │ (Port 3001)
│  - Command Queue (Best-effort)  │
│  - Stale Connection Checker     │
└────────┬───────────────┬────────┘
         │ MySQL (Pool)  │ MQTT TCP
         ▼               ▼
┌─────────────────┐  ┌──────────────────────────────────┐
│ MySQL Database  │  │ Mosquitto Broker (URL cấu hình)  │
│ (smart_home_db) │  └─────────────────┬────────────────┘
└─────────────────┘                    │
                                       ▼
                             ┌──────────────────┐
                             │  ESP32 Firmware  │
                             │ (DHT11, LDR, LED)│
                             └──────────────────┘
```

---

## 2. CẤU TRÚC SOURCE CODE BACKEND (`BE_IoT`)
```text
BE_IoT/
├── package.json          # Dependencies & Scripts
├── server.js             # Entry point (Express, Socket.IO, MQTT init)
├── .env.example          # Mẫu cấu hình an toàn
├── .gitignore            # Loại trừ node_modules và .env
├── README.md             # Hướng dẫn chi tiết
├── config/
│   ├── db.js             # MySQL Connection Pool
│   ├── mqtt.js           # MQTT Client kết nối broker
│   └── socket.js         # Socket.IO Server singleton
├── middleware/
│   ├── auth.js           # JWT Authentication middleware
│   └── errorHandler.js   # Bắt lỗi toàn cục
├── models/
│   ├── userModel.js      # Truy vấn bảng users
│   ├── deviceModel.js    # Truy vấn bảng device_list
│   ├── sensorModel.js    # Truy vấn bảng sensor_list & data_sensor
│   └── actionModel.js    # Truy vấn bảng action_device & dọn dẹp zombie
├── services/
│   ├── authService.js    # Logic đăng nhập, đăng ký, bcrypt
│   ├── deviceService.js  # Điều khiển đơn lẻ, All, Random (Single Source of Truth)
│   └── sensorService.js  # Lấy cảm biến mới nhất, lịch sử, đồ thị
├── controllers/
│   ├── authController.js
│   ├── deviceController.js
│   ├── sensorController.js
│   ├── actionController.js
│   └── healthController.js
├── routes/
│   ├── auth.routes.js
│   ├── device.routes.js
│   ├── sensor.routes.js
│   ├── action.routes.js
│   └── health.routes.js
├── mqtt/
│   ├── handler.js        # Parse sensor/data, device/status, esp32/status
│   └── commandQueue.js   # Hàng đợi lệnh tuần tự, Mutex nhóm, Best-effort ACK
└── database/
    ├── 001_users.sql
    ├── 002_device_list.sql
    ├── 003_sensor_list.sql
    ├── 004_data_sensor.sql
    ├── 005_action_device.sql
    └── seed.sql
```

---

## 3. YÊU CẦU MÔI TRƯỜNG & PHIÊN BẢN
- **Node.js**: Khuyến nghị phiên bản LTS `v18.x` hoặc `v20.x` (kiểm tra bằng lệnh `node -v`).
- **npm**: Phiên bản `9.x` trở lên (`npm -v`).
- **MySQL**: Phiên bản `8.0` hoặc MariaDB `10.4+`.
- **Mosquitto MQTT Broker**: Phiên bản `2.0+` đang chạy trên máy cục bộ hoặc máy ảo.

---

## 4. HƯỚNG DẪN CÀI ĐẶT TỪNG BƯỚC

### Bước 1: Cài đặt Dependencies cho Backend
Mở terminal tại thư mục `BE_IoT`:
```bash
cd BE_IoT
npm install
```

### Bước 2: Tạo Cơ sở dữ liệu bằng MySQL Workbench
1. Mở **MySQL Workbench** và kết nối vào MySQL Server cục bộ của bạn.
2. Tạo database mới:
   ```sql
   CREATE DATABASE smart_home_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   USE smart_home_db;
   ```
3. Mở và thực thi lần lượt 5 file migration SQL theo **đúng thứ tự sau**:
   - `database/001_users.sql` (Tạo bảng users)
   - `database/002_device_list.sql` (Tạo bảng device_list)
   - `database/003_sensor_list.sql` (Tạo bảng sensor_list)
   - `database/004_data_sensor.sql` (Tạo bảng data_sensor)
   - `database/005_action_device.sql` (Tạo bảng action_device)
4. Mở và thực thi file seed dữ liệu mẫu:
   - `database/seed.sql`

### Bước 3: Cấu hình biến môi trường
Tạo file `.env` tại thư mục `BE_IoT` dựa trên `.env.example`:
```bash
cp .env.example .env
```
Chỉnh sửa `.env` phù hợp với máy của bạn:
- `DB_USER`: Tên tài khoản MySQL (ví dụ `root`).
- `DB_PASSWORD`: Mật khẩu MySQL của bạn.
- `MQTT_BROKER_URL`: URL broker (ví dụ `mqtt://127.0.0.1:1883`).
- `JWT_SECRET`: Chuỗi khóa bảo mật bí mật (tối thiểu 32 ký tự).

### Bước 4: Khởi động Backend
```bash
# Chạy ở chế độ thông thường
npm start

# Hoặc chạy chế độ dev (tự reload khi sửa file)
npm run dev
```

Kiểm tra terminal thấy thông báo:
```text
🚀 IoT Smart Home Backend running on port 3001
📡 CORS allowed origin: http://localhost:5173
⚙️ Health endpoint: http://localhost:3001/api/health
```

### Bước 5: Khởi động Frontend
Mở một cửa sổ terminal khác tại thư mục `FE_IoT`:
```bash
cd FE_IoT
npm install
npm run dev
```
Truy cập trình duyệt tại: `http://localhost:5173`

---

## 5. TÀI KHOẢN MẪU ĐĂNG NHẬP
Sau khi chạy `seed.sql`, tài khoản Quản trị viên (ADMIN) đã có sẵn:
- **Email:** `giang@gmail.com`
- **Mật khẩu:** `123456`
*(Người dùng có thể vào trang Register để tạo thêm tài khoản USER mới)*.

---

## 6. KIỂM TRA HEALTH CHECK ENDPOINT
Gửi request GET đến: `http://localhost:3001/api/health`  
Kết quả mẫu:
```json
{
  "status": "OK",
  "timestamp": "2026-10-15T00:00:00.000Z",
  "uptimeSeconds": 12,
  "services": {
    "database": "CONNECTED",
    "mqttBroker": "CONNECTED",
    "esp32DataFeed": {
      "status": "ACTIVE",
      "message": "Receiving data normally",
      "lastSeenSecondsAgo": 3
    }
  }
}
```

---

## 7. GIAO THỨC MQTT & TẬP LỆNH FIRMWARE
Hệ thống **giữ nguyên 100% firmware ESP32 hiện có**, không thay đổi cú pháp:

| Topic | Định dạng Payload | Ý nghĩa |
|---|---|---|
| `device` | `led1 ON`, `led1 OFF`, `led2 ON`, `led2 OFF`, `led3 ON`, `led3 OFF` | Lệnh điều khiển từng LED |
| `device` | `all ON` / `all OFF` | Bật hoặc tắt tất cả LED |
| `device` | `all` | Chỉ truy vấn trạng thái LED (không thay đổi GPIO) |
| `sensor/data` | `temperature: 28 \| humidity: 81 \| light: 1320` | Dữ liệu đo cảm biến định kỳ |
| `device/status` | `LED1: ON \| LED2: OFF \| LED3: ON` | Trạng thái xác nhận từ ESP32 |
| `esp32/status` | `online` hoặc `offline` | Trạng thái kết nối của ESP32 |

---

## 8. GIỚI HẠN KỸ THUẬT (BEST-EFFORT CONFIRMATION)
1. **Best-effort ACK**: Do firmware không hỗ trợ `requestId`, Backend sử dụng hàng đợi FIFO tuần tự kết hợp timeout 5s để đối chiếu trạng thái. Nếu mạng bị trễ gói tin sau timeout, lệnh có thể bị đánh dấu `FAILED` trước khi nhận được phản hồi.
2. **Xác nhận GPIO vs Bóng LED**: Trạng thái `device/status` xác nhận vi điều khiển đã đặt mức logic cho chân GPIO; không đảm bảo bóng đèn LED vật lý phát sáng trong trường hợp hỏng bóng hoặc đứt dây.
3. **Phát hiện mất kết nối ESP32**: Theo dõi dựa trên ngưỡng `SENSOR_STALE_MS` (mặc định 15 giây). Nếu quá 15s không có dữ liệu cảm biến mới, trạng thái hiển thị là "Không nhận được dữ liệu gần đây", không khẳng định chắc chắn 100% phần cứng bị ngắt nguồn nếu broker chưa kích hoạt LWT.
