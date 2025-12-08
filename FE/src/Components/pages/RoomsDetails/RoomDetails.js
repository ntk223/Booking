import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../Layout/Navbar/Navbar";
import { Modal, Button, message, Spin, DatePicker, Card } from "antd";
import { format } from "date-fns"; // Import hàm format từ date-fns
import { Phone, Users, MapPin, DollarSign } from "lucide-react";
import "./RoomDetails.css";
import api from "../../../api/api";
const RoomDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [room, setRoom] = useState({});
  console.log(room);
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal state
  const location = useLocation();
  const { roomId, date: initialDate, startTime: initialStartTime, endTime: initialEndTime } = location.state || {};
  const [loading, setLoading] = useState(true);
  
  // Date and Time states
  const [selectedDate, setSelectedDate] = useState(initialDate ? new Date(initialDate) : null);
  const [selectedStartTime, setSelectedStartTime] = useState(initialStartTime || '');
  const [selectedEndTime, setSelectedEndTime] = useState(initialEndTime || '');
  // Lấy thông tin người dùng từ sessionStorage
  const user = sessionStorage.getItem("user");
  const userId = user ? JSON.parse(user).id : null;
  const userEmail = user ? JSON.parse(user).email : null;

  useEffect(() => {
    // Lấy thông tin phòng
    api
      .get(`/rooms/${id}`)
      .then((response) => {
        console.log(response);
        if (response.data) {
          setRoom(response.data);
        } else {
          console.error("Room not found");
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Lỗi khi lấy thông tin phòng:", error);
        setLoading(false);
      });

    // Lấy thông tin thiết bị trong phòng
    // axios
    //   .get(`http://localhost:5000/api/rooms/${id}/equipment`)
    //   .then((response) => {
    //     if (response.data && Array.isArray(response.data.equipment)) {
    //       setEquipment(response.data.equipment);
    //     } else {
    //       console.error("Dữ liệu thiết bị không hợp lệ");
    //       setEquipment([]);
    //     }
    //   })
    //   .catch((error) => {
    //     console.error("Lỗi khi lấy thông tin thiết bị:", error);
    //   });
  }, [id]);

  // Định dạng ngày theo dd-MM-yy
  const formatDate = (inputDate) => {
    if (!inputDate) return "";
    const parsedDate = new Date(inputDate);
    return format(parsedDate, "dd-MM-yy"); // Sử dụng date-fns để định dạng
  };

  // Xử lý đặt phòng
  const handleBooking = async () => {
    // Validate inputs
    if (!selectedDate || !selectedStartTime || !selectedEndTime) {
      message.error("Vui lòng chọn đầy đủ ngày và giờ!");
      return;
    }
    
    // Convert time strings to comparable format
    const startHour = parseInt(selectedStartTime.split(':')[0]);
    const startMin = parseInt(selectedStartTime.split(':')[1]);
    const endHour = parseInt(selectedEndTime.split(':')[0]);
    const endMin = parseInt(selectedEndTime.split(':')[1]);
    
    if (startHour > endHour || (startHour === endHour && startMin >= endMin)) {
      message.error("Giờ bắt đầu phải nhỏ hơn giờ kết thúc!");
      return;
    }
    
    try {
      const bookingData = {
        roomId: id,
        userId: userId, // Sử dụng userId mặc định nếu không có
        date: selectedDate.toISOString().split('T')[0], // Format: YYYY-MM-DD
        startTime: selectedStartTime,
        endTime: selectedEndTime,
        status: "pending",
      };

      // Gửi yêu cầu POST để tạo booking
      const bookingResponse = await api.post(
        "/bookings",
        bookingData
      );

      // Lấy bookingId từ phản hồi của API (dùng bookingId thay vì id)
      const bookingId = bookingResponse.data.bookingId; // Chú ý lấy từ bookingId

      // Đảm bảo rằng bookingId đã được gán trước khi sử dụng trong emailData
      const emailData = {
        to: userEmail,
        price: room.price,
        roomName: room.name,
        date: selectedDate.toISOString().split('T')[0],
        startTime: selectedStartTime,
        endTime: selectedEndTime,
        bookingId, // Đảm bảo sử dụng bookingId ở đây
      };

      // Gửi yêu cầu POST để gửi email
      // await axios.post("http://localhost:5000/api/send-email", emailData);

      // Hiển thị thông báo thành công
      message.success("Đặt phòng thành công!");

      // Đóng modal sau khi thành công
      setIsModalOpen(false);

      // Chuyển hướng đến trang "Cảm ơn" và gửi thêm thông tin booking
      navigate("/", {
        state: {
          room,
          date: selectedDate.toISOString().split('T')[0],
          startTime: selectedStartTime,
          endTime: selectedEndTime,
          userId,
          bookingId, // Gửi bookingId cùng với các thông tin khác
        },
      });
    } catch (error) {
      console.error("Lỗi đặt phòng:", error);
      message.error("Vui lòng đăng nhập để đặt phòng.");
    }
  };
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!room || !room.name) {
    return (
      <>
        <Navbar />
        <div style={{ textAlign: "center", padding: "50px" }}>
          <h2>Không tìm thấy phòng</h2>
          <Button type="primary" onClick={() => navigate("/searchrooms")}>
            Quay lại tìm kiếm
          </Button>
        </div>
      </>
    );
  }
  return (
    <>
      <Navbar />
      <div className="app-container">
        <div className="content-wrapper">
          {/* Room Header */}
          <div className="room-header">
            <div className="image-container">
              <img src={room.imageUrl} alt={room.name} />
              <div className="gradient-overlay"></div>
              <h1>{room.name}</h1>
            </div>
          </div>

          {/* Room Info */}
          <div className="room-info">
            <div className="info-item">
              <MapPin className="icon" />
              <div className="info-content">
                <p className="label">Địa điểm</p>
                <p className="value">{room.location}</p>
              </div>
            </div>
            <div className="info-item">
              <Users className="icon" />
              <div className="info-content">
                <p className="label">Sức chứa</p>
                <p className="value">{room.capacity}</p>
              </div>
            </div>
            <div className="info-item">
              <MapPin className="icon" />
              <div className="info-content">
                <p className="label">Quận</p>
                <p className="value">{room.district}</p>
              </div>
            </div>
            <div className="info-item">
              <DollarSign className="icon" />
              <div className="info-content">
                <p className="label">Giá</p>
                <p className="value">{room.price} VNĐ/1h</p>
              </div>
            </div>
          </div>

          {/* Equipment Section */}
          <div className="equipment-section">
            <h2>Trang thiết bị</h2>
            <div className="equipment-grid">
              {room.equipments.length > 0 ? room.equipments.map((eq, index) => (
                <div className="equipment-item" key={index}>
                  {eq.trim()}
                </div>
              )) : <p>Máy chiếu, Micro</p>}
            </div>
          </div>

          {/* Contact Section */}
          <div className="contact-section">
            <h2>Liên hệ</h2>
            <p className="contact-text">
              Để biết thêm chi tiết hoặc hỗ trợ, vui lòng gọi số điện thoại dưới
              đây:
            </p>
            <div className="phone-container">
              <Phone className="phone-icon" />
              <span className="phone-number">+84 123 456 789</span>
            </div>
          </div>

          {/* Date and Time Selection */}
          <div className="booking-section">
            <Card title="Chọn ngày và giờ đặt phòng" className="booking-card">
              <div className="datetime-container">
                <div className="date-picker-container">
                  <label className="datetime-label">Ngày đặt phòng:</label>
                  <DatePicker
                    value={selectedDate}
                    onChange={setSelectedDate}
                    format="DD/MM/YYYY"
                    placeholder="Chọn ngày"
                    disabledDate={(current) => current && current < new Date().setHours(0,0,0,0)}
                    className="datetime-picker"
                  />
                </div>
                
                <div className="time-picker-container">
                  <div className="time-input-group">
                    <div className="time-input">
                      <label className="datetime-label">Giờ bắt đầu:</label>
                      <input
                        type="time"
                        value={selectedStartTime}
                        onChange={(e) => setSelectedStartTime(e.target.value)}
                        placeholder="Chọn giờ bắt đầu"
                        className="datetime-picker"
                      />
                    </div>
                    
                    <div className="time-input">
                      <label className="datetime-label">Giờ kết thúc:</label>
                      <input
                        type="time"
                        value={selectedEndTime}
                        onChange={(e) => setSelectedEndTime(e.target.value)}
                        placeholder="Chọn giờ kết thúc"
                        className="datetime-picker"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Booking Button */}
          <div className="booking-button-container">
            <Button
              type="primary"
              className="btn-book"
              onClick={() => setIsModalOpen(true)}
              disabled={!selectedDate || !selectedStartTime || !selectedEndTime}
            >
              Đặt Phòng
            </Button>
          </div>

          {/* Modal */}
          <Modal
            title="Xác nhận đặt phòng"
            open={isModalOpen}
            onOk={handleBooking}
            onCancel={() => setIsModalOpen(false)}
            okText="Xác nhận"
            cancelText="Hủy"
          >
            <p>
              Bạn có chắc chắn muốn đặt phòng <strong>{room.name}</strong>{" "}
              không?
            </p>
            <p>
              <strong>Ngày:</strong> {selectedDate ? formatDate(selectedDate) : 'Chưa chọn'}
            </p>
            <p>
              <strong>Thời gian:</strong> {selectedStartTime || 'Chưa chọn'} - {selectedEndTime || 'Chưa chọn'}
            </p>
            <p>
              <strong>Giá:</strong> {room.price} VNĐ/giờ
            </p>
          </Modal>
        </div>
      </div>
    </>
  );
};

export default RoomDetails;
