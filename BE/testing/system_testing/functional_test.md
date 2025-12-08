# Kịch Bản Kiểm Thử Chức Năng
### Phương tiện kiểm thử: thủ công bằng giao diện và postman

## 1. Register

- **Tên chức năng**: Đăng ký tài khoản người dùng
- **API Endpoint**: `POST /auth/register`
- **Mục đích**: Cho phép người dùng mới tạo tài khoản trong hệ thống
### Request Body:
```json
{
  "name": "string (bắt buộc)",
  "email": "string (bắt buộc)",
  "password": "string (bắt buộc)",
  "phone": "string (tùy chọn)",
}
```
### **REG-1: Đăng ký thành công với dữ liệu hợp lệ đầy đủ**
**Điều kiện**: 
- Email chưa tồn tại trong hệ thống

**Input**:
- Method: `POST`
- Endpoint: `/auth/register`
- Request body:
```json
{
  "name": "Nguyen Van A",
  "email": "nguyenvana@example.com",
  "password": "password123",
  "phone": "0123456789",
}
```
**Output**:
- Status Code: `201 Created`
- Response body chứa thông tin user:
```json
{
  "id": "number",
  "name": "Nguyen Van A",
  "email": "nguyenvana@example.com",
  "phone": "0123456789",
  "role": "user",
  "createdAt": "timestamp"
}
```
- **Hiển thị Frontend**: Chuyển hướng đến trang đăng nhập với thông báo "Đăng ký thành công"


---

### **REG-2: Đăng ký thành công với dữ liệu tối thiểu**

**Mục đích**: Kiểm tra đăng ký chỉ với các trường bắt buộc

**Điều kiện**: 
- Email chưa tồn tại trong hệ thống

**Input**:
- Method: `POST`
- Endpoint: `/auth/register`
- Request body:
```json
{
  "name": "Tran Thi B",
  "email": "tranthib@example.com",
  "password": "password123"
}
```
**Expected Output**:
- Status Code: `201 Created`
- Response body chứa thông tin user với các trường tùy chọn có giá trị mặc định:
```json
{
  "id": "number",
  "name": "Tran Thi B",
  "email": "tranthib@example.com",
  "phone": null,
  "role": "user",
  "createdAt": "timestamp"
}
```
- **Hiển thị Frontend**: Chuyển hướng đến trang đăng nhập với thông báo "Đăng ký thành công"

---

### **REG-3: Đăng ký thất bại - Thiếu trường name**

**Mục đích**: Kiểm tra validation khi thiếu trường bắt buộc name

**Input**:
- Method: `POST`
- Endpoint: `/auth/register`
- Request body:
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```
**Expected Output**:
- Status Code: `400 Bad Request`
- Response body chứa thông báo lỗi:
```json
{
  "message": "Name is required"
}
```
- **Hiển thị Frontend**: Thông báo lỗi cần fill field

---

### **REG-4: Đăng ký thất bại - Thiếu trường email**

**Mục đích**: Kiểm tra validation khi thiếu trường bắt buộc email

**Input**:
- Method: `POST`
- Endpoint: `/auth/register`
- Request body:
```json
{
  "name": "Test",
  "password": "password123"
}
```

**Expected Output**:
- Status Code: `400 Bad Request`
- Response body chứa thông báo lỗi:
```json
{
  "message": "Email is required"
}
```
- **Hiển thị Frontend**: Thông báo lỗi cần fill field

---

### **REG-5: Đăng ký thất bại - Thiếu trường password**

**Mục đích**: Kiểm tra validation khi thiếu trường bắt buộc password

**Input**:
- Method: `POST`
- Endpoint: `/auth/register`
- Request body:
```json
{
  "name": "Test",
  "email": "test@example.com"
}
```

**Expected Output**:
- Status Code: `400 Bad Request`
- Response body chứa thông báo lỗi:
```json
{
  "message": "Password is required"
}
```
- **Hiển thị Frontend**: Thông báo lỗi cần fill field

---

### **REG-6: Đăng ký thất bại - Email không đúng định dạng**

**Mục đích**: Kiểm tra validation email format

**Input**:
- Method: `POST`
- Endpoint: `/auth/register`
- Request body:
```json
{
  "name": "Test User",
  "email": "invalid-email-format",
  "password": "password123"
}
```

**Expected Output**:
- Status Code: `400 Bad Request`
- Response body chứa thông báo lỗi:
```json
{
  "message": "Email must be a valid email address"
}
```
- **Hiển thị Frontend**: Thông báo lỗi "Email không hợp lệ"

---


### **REG-7: Đăng ký thất bại - Email đã tồn tại**

**Mục đích**: Kiểm tra hệ thống không cho phép đăng ký với email đã được sử dụng

**Điều kiện**: 
- Email "existing@example.com" đã tồn tại trong database

**Input**:
- Method: `POST`
- Endpoint: `/auth/register`
- Request body:
```json
{
  "name": "Another",
  "email": "tranthib@example.com",
  "password": "password123"
}
```

**Expected Output**:
- Status Code: `500 Server Eror`
- Response body chứa thông báo lỗi:
```json
{
  "message": "Email already exists"
```
- **Hiển thị Frontend**: Thông báo lỗi "Đăng kí thất bại"

---

## 2. Login

- **Tên chức năng**: Đăng nhập hệ thống
- **API Endpoint**: `POST /auth/login`
- **Mục đích**: Cho phép người dùng đã đăng ký đăng nhập vào hệ thống

### Request Body:
```json
{
  "email": "string (bắt buộc)",
  "password": "string (bắt buộc)"
}
```

### **LOG-1: Đăng nhập thành công với thông tin hợp lệ**

**Mục đích**: Kiểm tra người dùng có thể đăng nhập thành công với email và password đúng

**Điều kiện**: 
- User với email "nguyenvana@example.com" và password "password123" đã tồn tại trong hệ thống

**Input**:
- Method: `POST`
- Endpoint: `/auth/login`
- Request body:
```json
{
  "email": "nguyenvana@example.com",
  "password": "password123"
}
```

**Expected Output**:
- Status Code: `200 OK`
- Response body chứa token và thông tin user:
```json
{
  "token": "JWT_token_string",
  "user": {
    "id": "number",
    "name": "string",
    "email": "nguyenvana@example.com",
    "phone": "string",
    "role": "user",
    "createdAt": "timestamp"
  }
}
```
- **Hiển thị Frontend**: Chuyển hướng đến trang chủ và hiển thị tên người dùng trên header

---

### **LOG-2: Đăng nhập thất bại - Email không tồn tại**

**Mục đích**: Kiểm tra hệ thống xử lý khi đăng nhập với email chưa đăng ký

**Điều kiện**: 
- Email "nonexistent@example.com" không tồn tại trong hệ thống

**Input**:
- Method: `POST`
- Endpoint: `/auth/login`
- Request body:
```json
{
  "email": "nonexistent@example.com",
  "password": "password123"
}
```

**Expected Output**:
- Status Code: `404 Not Found`
- Response body chứa thông báo lỗi:
```json
{
  "message": "User not found"
}
```
- **Hiển thị Frontend**: Thông báo lỗi "Đăng nhập không hợp lệ, vui lòng thử lại!" 

---

### **LOG-3: Đăng nhập thất bại - Sai mật khẩu**

**Mục đích**: Kiểm tra hệ thống xử lý khi đăng nhập với password sai

**Điều kiện**: 
- User với email "nguyenvana@example.com" đã tồn tại trong hệ thống
- Password đúng là "password123"

**Input**:
- Method: `POST`
- Endpoint: `/auth/login`
- Request body:
```json
{
  "email": "nguyenvana@example.com",
  "password": "password1234"
}
```

**Expected Output**:
- Status Code: `401 Unauthorized`
- Response body chứa thông báo lỗi:
```json
{
  "message": "Incorrect password"
}
```
- **Hiển thị Frontend**: Thông báo lỗi "Đăng nhập không hợp lệ, vui lòng thử lại!" 

---

### **LOG-4: Đăng nhập thất bại - Thiếu trường email**

**Mục đích**: Kiểm tra validation khi thiếu trường email bắt buộc

**Input**:
- Method: `POST`
- Endpoint: `/auth/login`
- Request body:
```json
{
  "password": "password123"
}
```

**Expected Output**:
- Status Code: `400 Bad Request`
- Response body chứa thông báo lỗi:
```json
{
  "message": "Email is required"
}
```
- **Hiển thị Frontend**: Thông báo lỗi "Đăng nhập không hợp lệ, vui lòng thử lại!" 

---

### **LOG-5: Đăng nhập thất bại - Thiếu trường password**

**Mục đích**: Kiểm tra validation khi thiếu trường password bắt buộc

**Input**:
- Method: `POST`
- Endpoint: `/auth/login`
- Request body:
```json
{
  "email": "nguyenvana@example.com"
}
```

**Expected Output**:
- Status Code: `400 Bad Request`
- Response body chứa thông báo lỗi:
```json
{
  "message": "Password is required"
}
```
- **Hiển thị Frontend**: Thông báo lỗi "Đăng nhập không hợp lệ, vui lòng thử lại!" 
---

### **LOG-6: Đăng nhập thất bại - Email không đúng định dạng**

**Mục đích**: Kiểm tra validation định dạng email

**Input**:
- Method: `POST`
- Endpoint: `/auth/login`
- Request body:
```json
{
  "email": "mmmmmmmm",
  "password": "password123"
}
```

**Expected Output**:
- Status Code: `400 Bad Request`
- Response body chứa thông báo lỗi:
```json
{
  "message": "Email must be a valid email address"
}
```
- **Hiển thị Frontend**: Thông báo lỗi "Đăng nhập không hợp lệ, vui lòng thử lại!" 
---

## 3. Xem Phòng

- **Tên chức năng**: Xem danh sách và chi tiết phòng
- **API Endpoints**: 
  - `GET /rooms` - Lấy danh sách phòng
  - `GET /rooms/:id` - Lấy chi tiết phòng
  - `POST /rooms/search` - Tìm kiếm phòng
- **Mục đích**: Cho phép người dùng xem thông tin phòng họp

### **ROOM-1: Xem danh sách phòng thành công (trang đầu)**

**Mục đích**: Kiểm tra người dùng có thể xem danh sách tất cả phòng

**Input**:
- Method: `GET`
- Endpoint: `/rooms`

**Expected Output**:
- Status Code: `200 OK`
- Response body chứa danh sách phòng với pagination:
```json
{
  "rooms": [
    {
      "id": "number",
      "name": "string",
      "location": "string",
      "capacity": "number",
      "price": "number",
      "districtId": "string",
      "imageUrl": "string",
      "description": "string"
    }
  ],
  "currentPage": 1,
  "totalPages": "number",
  "totalRooms": "number"
}
```
- **Hiển thị Frontend**: Hiển thị danh sách phòng dưới dạng lưới (grid) với ảnh, tên, địa chỉ, giá.

---

### **ROOM-2: Xem danh sách phòng với phân trang**

**Mục đích**: Kiểm tra chức năng phân trang hoạt động đúng

**Điều kiện**: 
- Có nhiều phòng trong hệ thống (đủ để phân trang)

**Input**:
- Method: `GET`
- Endpoint: `/rooms?page=2`

**Expected Output**:
- Status Code: `200 OK`
- Response body chứa:
```json
{
  "rooms": [...],
  "currentPage": 2,
  "totalPages": "number",
  "totalRooms": "number"
}
```
- **Hiển thị Frontend**: Hiển thị danh sách phòng trang 2, nút trang 2 được highlight, cho phép chuyển sang trang khác

---

### **ROOM-3: Xem chi tiết phòng thành công**

**Mục đích**: Kiểm tra người dùng có thể xem chi tiết một phòng cụ thể

**Điều kiện**: 
- Phòng với ID hợp lệ có trong hệ thống

**Input**:
- Method: `GET`
- Endpoint: `/rooms/1`

**Expected Output**:
- Status Code: `200 OK`
- Response body chứa thông tin chi tiết đầy đủ của phòng, ví dụ:
```json
{
  "id": 1,
  "name": "Phòng học A",
  "location": "Tầng 3, Toà nhà ABC",
  "capacity": 10,
  "price": 200000,
  "districtId": "1",
  "imageUrl": "https://example.com/room.jpg",
  "description": "Phòng học nhỏ, đầy đủ tiện nghi",
  "equipments": [...]
}
```
- **Hiển thị Frontend**: Trang chi tiết phòng hiển thị ảnh lớn, thông tin phòng (địa chỉ, sức chứa, giá, mô tả), danh sách thiết bị và nút "Đặt phòng"

---

### **ROOM-4: Xem chi tiết phòng không tồn tại**

**Mục đích**: Kiểm tra xử lý khi truy cập phòng không tồn tại

**Điều kiện**: 
- ID phòng 99999 không tồn tại trong hệ thống

**Input**:
- Method: `GET`
- Endpoint: `/rooms/99999`

**Expected Output**:
- Status Code: `404 Not Found`
- Response body:
```json
{
  "message": "Room not found"
}
```
- Không trả về dữ liệu phòng
- **Hiển thị Frontend**: Hiển thị trang  "Không tìm thấy phòng" và nút quay lại danh sách phòng

---

### **ROOM-5: Xem chi tiết phòng với ID không hợp lệ**

**Mục đích**: Kiểm tra validation ID phòng

**Input**:
- Method: `GET`
- Endpoint: `/rooms/-1`

**Expected Output**:
- Status Code: `404 Not Found`
- Response body:
```json
{
  "message": "Room not found"
}
```
- **Hiển thị Frontend**: Hiển thị trang  "Không tìm thấy phòng" và nút quay lại danh sách phòng

---

### **ROOM-6: Tìm kiếm phòng theo capacity**

**Mục đích**: Kiểm tra tìm kiếm phòng theo sức chứa

**Điều kiện**: 
- Có các phòng với capacity khác nhau trong hệ thống

**Input**:
- Method: `POST`
- Endpoint: `/rooms/search`
- Request body:
```json
{
  "capacity": 10
}
```

**Expected Output**:
- Status Code: `200 OK`
- Response body chứa danh sách phòng có capacity >= 10, ví dụ:
```json
[
  {
    "id": "number",
    "name": "string",
    "capacity": 10,
    ...
  },
  {
    "id": "number",
    "name": "string",
    "capacity": 15,
    ...
  }
]
```
- **Hiển thị Frontend**: Hiển thị kết quả tìm kiếm dưới dạng lưới

---

### **ROOM-7: Tìm kiếm phòng theo districtId**

**Mục đích**: Kiểm tra tìm kiếm phòng theo quận/huyện

**Điều kiện**: 
- Có các phòng thuộc district khác nhau trong hệ thống

**Input**:
- Method: `POST`
- Endpoint: `/rooms/search`
- Request body:
```json
{
  "districtId": "1"
}
```

**Expected Output**:
- Status Code: `200 OK`
- Response body chứa danh sách phòng thuộc districtId = "1":
```json
[
  {
    "id": "number",
    "name": "string",
    "districtId": "1",
    ...
  }
]
```
- **Hiển thị Frontend**: Hiển thị kết quả tìm kiếm theo quận, hiển thị bộ lọc đang active cho quận được chọn
---

### **ROOM-8: Tìm kiếm phòng với nhiều tiêu chí**

**Mục đích**: Kiểm tra tìm kiếm phòng kết hợp nhiều điều kiện

**Điều kiện**: 
- Có đa dạng phòng trong hệ thống

**Input**:
- Method: `POST`
- Endpoint: `/rooms/search`
- Request body:
```json
{
  "capacity": 10,
  "districtId": "1",
  "searchDate": "2025-12-10",
  "startTime": 9,
  "endTime": 12
}
```

**Expected Output**:
- Status Code: `200 OK`
- Response body chứa danh sách phòng đáp ứng TẤT CẢ các điều kiện:
  - Capacity >= 10
  - District = "1"
  - Phòng trống trong khung giờ 9h-12h ngày 10/12/2025
```json
[
  {
    "id": "number",
    "name": "string",
    "capacity": 10,
    "districtId": "1",
    ...
  }
]
```

- **Hiển thị Frontend**: Hiển thị kết quả tìm kiếm.

---

### **ROOM-9: Tìm kiếm phòng không có kết quả**

**Mục đích**: Kiểm tra xử lý khi không tìm thấy phòng nào phù hợp

**Input**:
- Method: `POST`
- Endpoint: `/rooms/search`
- Request body:
```json
{
  "capacity": 1000
}
```

**Expected Output**:
- Status Code: `200 OK`
- Response body: mảng rỗng
```json
[]
```
- **Hiển thị Frontend**: Hiển thị thông báo "Không tìm thấy phòng" 
---

## 4. Đặt Phòng (Booking)

- **Tên chức năng**: Đặt phòng họp
- **API Endpoints**: 
  - `POST /bookings` - Tạo booking mới
  - `GET /bookings` - Lấy danh sách booking
  - `PUT /bookings/:id` - Cập nhật trạng thái booking
- **Mục đích**: Cho phép người dùng đặt phòng họp

### **BOOK-1: Đặt phòng thành công**

**Mục đích**: Kiểm tra người dùng có thể đặt phòng thành công với thông tin hợp lệ

**Điều kiện**: 
- User đã đăng nhập (có token hợp lệ)
- Phòng với roomId="1" tồn tại
- Phòng chưa được đặt trong khung giờ yêu cầu

**Input**:
- Method: `POST`
- Endpoint: `/bookings`
- Request body:
```json
{
  "roomId": "1",
  "userId": "1",
  "date": "2025-12-15",
  "startTime": 9,
  "endTime": 11
}
```

**Expected Output**:
- Status Code: `201 Created`
- Response body chứa thông tin booking:
```json
{
  "id": "number",
  "roomId": "1",
  "userId": "1",
  "date": "2025-12-15",
  "startTime": 9,
  "endTime": 11,
  "status": "pending",
  "createdAt": "timestamp"
}
```
- Booking được lưu vào database
- **Hiển thị Frontend**: Chuyển hướng đến trang "Thank You" và thông báo "Đặt phòng thành công"

---

### **BOOK-2: Đặt phòng thất bại - Thiếu trường roomId**

**Mục đích**: Kiểm tra validation khi thiếu trường bắt buộc

**Điều kiện**: User đã đăng nhập

**Input**:
- Method: `POST`
- Endpoint: `/bookings`
- Request body:
```json
{
  "userId": "1",
  "date": "2025-12-15",
  "startTime": 9,
  "endTime": 11
}
```

**Expected Output**:
- Status Code: `400 Bad Request`
- Response body:
```json
{
  "message": "Room ID is required"
}
```
- Không tạo booking trong database
- **Hiển thị Frontend**: 

---

### **BOOK-3: Đặt phòng thất bại - Thiếu trường userId**

**Mục đích**: Kiểm tra validation khi thiếu userId

**Điều kiện**: User chưa đăng nhập

**Input**:
- Method: `POST`
- Endpoint: `/bookings`
- Request body:
```json
{
  "roomId": "1",
  "date": "2025-12-15",
  "startTime": 9,
  "endTime": 11
}
```

**Expected Output**:
- Status Code: `400 Bad Request`
- Response body:
```json
{
  "message": "User ID is required"
}
```
- **Hiển thị Frontend**: Thông báo lỗi "Vui lòng đăng nhập"

---

### **BOOK-4: Đặt phòng thất bại - Thiếu trường date**

**Mục đích**: Kiểm tra validation khi thiếu ngày đặt phòng

**Input**:
- Method: `POST`
- Endpoint: `/bookings`
- Request body:
```json
{
  "roomId": "1",
  "userId": "1",
  "startTime": 9,
  "endTime": 11
}
```

**Expected Output**:
- Status Code: `400 Bad Request`
- Response body:
```json
{
  "message": "Date is required"
}
```
- **Hiển thị Frontend**: Disable nút đặt phòng

---

### **BOOK-5: Đặt phòng thất bại - endTime <= startTime**

**Mục đích**: Kiểm tra validation thời gian kết thúc phải sau thời gian bắt đầu

**Input**:
- Method: `POST`
- Endpoint: `/bookings`
- Request body:
```json
{
  "roomId": "1",
  "userId": "1",
  "date": "2025-12-15",
  "startTime": 11,
  "endTime": 9
}
```

**Expected Output**:
- Status Code: `400 Bad Request`
- Response body:
```json
{
  "message": "End time must be after start time"
}
```
- **Hiển thị Frontend**: Thông báo lỗi "Giờ bắt đầu phải nhỏ hơn giờ kết thúc"

---

### **BOOK-6: Đặt phòng thất bại - Phòng đã được đặt**

**Mục đích**: Kiểm tra hệ thống ngăn đặt phòng trùng lặp

**Điều kiện**: 
- Đã có booking cho roomId="1" vào ngày "2025-12-15" từ 9h-11h

**Input**:
- Method: `POST`
- Endpoint: `/bookings`
- Request body:
```json
{
  "roomId": "1",
  "userId": "2",
  "date": "2025-12-15",
  "startTime": 10,
  "endTime": 12
}
```

**Expected Output**:
- Status Code: `400 Bad Request`
- Response body:
```json
{
  "message": "Room is already booked for this time slot"
}
```
- Không tạo booking mới
- **Hiển thị Frontend**: Thông báo lỗi "Phòng đã được đặt"

---

### **BOOK-7: Đặt phòng thất bại - RoomId không tồn tại**

**Mục đích**: Kiểm tra xử lý khi đặt phòng không tồn tại

**Input**:
- Method: `POST`
- Endpoint: `/bookings`
- Request body:
```json
{
  "roomId": "99999",
  "userId": "1",
  "date": "2025-12-15",
  "startTime": 9,
  "endTime": 11
}
```

**Expected Output**:
- Status Code: `400 Bad Request`
- Response body:
```json
{
  "message": "Invalid room or user ID"
}
```
- **Hiển thị Frontend**:

---

### **BOOK-8: Đặt phòng thất bại - UserId không tồn tại**

**Mục đích**: Kiểm tra xử lý khi userId không hợp lệ

**Input**:
- Method: `POST`
- Endpoint: `/bookings`
- Request body:
```json
{
  "roomId": "1",
  "userId": "99999",
  "date": "2025-12-15",
  "startTime": 9,
  "endTime": 11
}
```

**Expected Output**:
- Status Code: `400 Bad Request`
- Response body:
```json
{
  "message": "Invalid room or user ID"
}
```
- **Hiển thị Frontend**:

---

### **BOOK-9: Xem danh sách booking thành công**

**Mục đích**: Kiểm tra người dùng có thể xem tất cả booking

**Điều kiện**: 
- User đã đăng nhập
- Có ít nhất 1 booking trong hệ thống

**Input**:
- Method: `GET`
- Endpoint: `/bookinghistory`

**Expected Output**:
- Status Code: `200 OK`
- Response body chứa danh sách booking:
```json
[
  {
    "id": "number",
    "roomId": "1",
    "userId": "1",
    "date": "2025-12-15",
    "startTime": 9,
    "endTime": 11,
    "status": "pending",
    "createdAt": "timestamp"
  }
]
```
- **Hiển thị Frontend**: Hiển thị danh sách đã booking 

---

### **BOOK-10: Cập nhật trạng thái booking thành công**

**Mục đích**: Kiểm tra có thể cập nhật trạng thái booking

**Điều kiện**: 
- Admin đăng nhập 
- Booking với id="1" tồn tại

**Input**:
- Method: `PUT`
- Endpoint: `/bookings/1`
- Request body:
```json
{
  "status": "confirmed"
}
```

**Expected Output**:
- Status Code: `200 OK`
- Booking được cập nhật trạng thái thành "confirmed" trong database
- **Hiển thị Frontend**: Thông báo "Cập nhật trạng thái thành công", trạng thái booking được cập nhật trên giao diện

---

## 5. Admin

- **Tên chức năng**: Quản lý hệ thống bởi Admin
- **API Endpoints**: 
  - `POST /auth/login` - Đăng nhập Admin
  - `POST /rooms` - Tạo phòng mới
  - `PUT /rooms/:id` - Cập nhật thông tin phòng
  - `DELETE /rooms/:id` - Xóa phòng
  - `DELETE /users/:id` - Xóa người dùng
  - `GET /users` - Xem danh sách người dùng
- **Mục đích**: Cho phép Admin quản lý phòng và người dùng

### **ADMIN-1: Đăng nhập Admin thành công**

**Mục đích**: Kiểm tra Admin có thể đăng nhập vào hệ thống quản lý

**Điều kiện**: 
- Tài khoản Admin với email và password hợp lệ đã tồn tại trong hệ thống

**Input**:
- Method: `POST`
- Endpoint: `/auth/login`
- Request body:
```json
{
  "email": "k@example.com",
  "password": "1234"
}
```

**Expected Output**:
- Status Code: `200 OK`
- Response body chứa token và thông tin admin:
```json
{
  "token": "JWT_token_string",
  "user": {
    "id": "number",
    "name": "string",
    "email": "k@example.com",
    "phone": "string",
    "role": "admin",
    "createdAt": "timestamp"
  }
}
```
- **Hiển thị Frontend**: Chuyển hướng đến trang Dashboard quản lý với các menu: Quản lý phòng, Quản lý người dùng, Quản lý booking

---

### **ADMIN-2: Đăng nhập Admin thất bại - Không phải tài khoản Admin**

**Mục đích**: Kiểm tra hệ thống không cho phép user thường truy cập trang quản lý


**Input**:
- Method: `POST`
- Endpoint: `/auth/login`
- Request body:
```json
{
  "email": "nguyenvana@example.com",
  "password": "password123"
}
```

**Expected Output**:
- Status Code: `200 OK`
- Response body chứa token và thông tin user:
```json
{
  "token": "JWT_token_string",
  "user": {
    "id": "number",
    "name": "Nguyen Van A",
    "email": "nguyenvana@example.com",
    "phone": "0123456789",
    "role": "user",
    "createdAt": "timestamp"
  }
}
```
- **Hiển thị Frontend**: Chuyển hướng đến trang chủ (không phải Dashboard), nếu user cố truy cập URL dashboard thì hiển thị "Bạn không có quyền truy cập trang này"

---

### **ADMIN-3: Tạo phòng mới thành công**

**Mục đích**: Kiểm tra Admin có thể tạo phòng mới với thông tin hợp lệ

**Điều kiện**: 
- Admin đã đăng nhập (có token hợp lệ)
- District với id="1" tồn tại trong hệ thống

**Input**:
- Method: `POST`
- Endpoint: `/rooms`
- Request body:
```json
{
  "name": "Phòng Họp A101",
  "location": "Tầng 1, Toà nhà A",
  "capacity": 20,
  "price": 500000,
  "districtId": "1",
  "imageUrl": "https://example.com/room-a101.jpg",
  "description": "Phòng họp lớn, đầy đủ tiện nghi"
}
```

**Expected Output**:
- Status Code: `201 Created`
- Response body chứa thông tin phòng vừa tạo:
```json
{
  "id": "number",
  "name": "Phòng Họp A101",
  "location": "Tầng 1, Toà nhà A",
  "capacity": 20,
  "price": 500000,
  "districtId": "1",
  "imageUrl": "https://example.com/room-a101.jpg",
  "description": "Phòng họp lớn, đầy đủ tiện nghi",
  "createdAt": "timestamp"
}
```
- **Hiển thị Frontend**: Thông báo "Tạo phòng thành công", phòng mới xuất hiện trong danh sách quản lý phòng

---

### **ADMIN-4: Tạo phòng thất bại - Thiếu thông tin bắt buộc**

**Mục đích**: Kiểm tra validation khi tạo phòng thiếu các trường bắt buộc

**Điều kiện**: Admin đã đăng nhập

**Input**:
- Method: `POST`
- Endpoint: `/rooms`
- Request body:
```json
{
  "name": "Phòng Họp B101",
  "capacity": 10
}
```

**Expected Output**:
- Status Code: `400 Bad Request`
- Response body:
```json
{
  "message": "Location is required"
}
```
- **Hiển thị Frontend**: Thông báo lỗi "{field} is required", highlight các trường còn thiếu

---

### **ADMIN-5: Tạo phòng thất bại - Không có quyền Admin**

**Mục đích**: Kiểm tra chỉ Admin mới có thể tạo phòng

**Input**:
- Method: `POST`
- Endpoint: `/rooms`
- Request body:
```json
{
  "name": "Phòng Họp C101",
  "location": "Tầng 3",
  "capacity": 15,
  "price": 300000,
  "districtId": "1",
  "description": "Test room"
}
```

**Expected Output**:
- Status Code: `403 Forbidden`
- Response body:
```json
{
  "message": "Access denied. Admin privileges required"
}
```
- **Hiển thị Frontend**: 

---

### **ADMIN-6: Chỉnh sửa thông tin phòng thành công**

**Mục đích**: Kiểm tra Admin có thể cập nhật thông tin phòng

**Điều kiện**: 
- Admin đã đăng nhập
- Phòng với id="1" tồn tại

**Input**:
- Method: `PUT`
- Endpoint: `/rooms/1`
- Request body:
```json
{
  "name": "Phòng Họp A101 - Updated",
  "capacity": 25,
  "price": 600000
}
```

**Expected Output**:
- Status Code: `200 OK`
- Response body chứa thông tin phòng đã cập nhật:
```json
{
  "id": 1,
  "name": "Phòng Họp A101 - Updated",
  "location": "Tầng 1, Toà nhà A",
  "capacity": 25,
  "price": 600000,
  "districtId": "1",
  "imageUrl": "https://example.com/room-a101.jpg",
  "description": "Phòng họp lớn, đầy đủ tiện nghi",
  "updatedAt": "timestamp"
}
```
- **Hiển thị Frontend**: Thông báo "Cập nhật phòng thành công", thông tin phòng được cập nhật trên giao diện

---

### **ADMIN-7: Chỉnh sửa phòng thất bại - Phòng không tồn tại**

**Mục đích**: Kiểm tra xử lý khi cập nhật phòng không tồn tại

**Điều kiện**: Admin đã đăng nhập

**Input**:
- Method: `PUT`
- Endpoint: `/rooms/99999`
- Request body:
```json
{
  "name": "Updated Room",
  "capacity": 30
}
```

**Expected Output**:
- Status Code: `404 Not Found`
- Response body:
```json
{
  "message": "Room not found"
}
```
- **Hiển thị Frontend**:

---

### **ADMIN-8: Xóa phòng thành công**

**Mục đích**: Kiểm tra Admin có thể xóa phòng

**Điều kiện**: 
- Admin đã đăng nhập
- Phòng với id="5" tồn tại
- Phòng không có booking đang hoạt động

**Input**:
- Method: `DELETE`
- Endpoint: `/rooms/5`

**Expected Output**:
- Status Code: `200 OK`
- Response body:
```json
{
  "message": "Room deleted successfully"
}
```
- Phòng bị xóa khỏi database
- Cache được cập nhật
- **Hiển thị Frontend**: Thông báo "Xóa phòng thành công", phòng biến mất khỏi danh sách


---

### **ADMIN-9: Xóa người dùng thành công**

**Mục đích**: Kiểm tra Admin có thể xóa tài khoản người dùng

**Điều kiện**: 
- Admin đã đăng nhập
- User với id="10" tồn tại

**Input**:
- Method: `DELETE`
- Endpoint: `/users/4`

**Expected Output**:
- Status Code: `200 OK`
- Response body:
```json
{
  "message": "User deleted successfully"
}
```
- User bị xóa khỏi database
- **Hiển thị Frontend**: Thông báo "Xóa người dùng thành công", user biến mất khỏi danh sách quản lý

---

### **ADMIN-10: Xem danh sách tất cả người dùng**

**Mục đích**: Kiểm tra Admin có thể xem danh sách toàn bộ người dùng trong hệ thống

**Điều kiện**: 
- Admin đã đăng nhập
- Có nhiều user trong hệ thống

**Input**:
- Method: `GET`
- Endpoint: `/users`

**Expected Output**:
- Status Code: `200 OK`
- Response body chứa danh sách tất cả user, ví dụ:
```json
[
  {
    "id": 1,
    "name": "Nguyen Van A",
    "email": "nguyenvana@example.com",
    "phone": "0123456789",
    "role": "user",
  },
  {
    "id": 2,
    "name": "Tran Thi B",
    "email": "tranthib@example.com",
    "phone": "",
    "role": "user",
  }
]
```
- **Hiển thị Frontend**: Hiển thị bảng danh sách người dùng với các cột: ID, Tên, Email, Số điện thoại, Vai trò, và nút Edit, Xóa
---



