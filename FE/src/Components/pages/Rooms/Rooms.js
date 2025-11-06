import React, { useEffect, useState } from "react";
import { Card, Row, Col, Spin, Tag } from "antd";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // ✅ Thêm dòng này
import Navbar from "../../Layout/Navbar/Navbar";
import Footer from "../../Layout/Footer/Footer";

const { Meta } = Card;

const RoomsList = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // ✅ Dùng để điều hướng

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/list");
        setRooms(res.data);
      } catch (error) {
        console.error("Error fetching rooms:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div style={{ padding: "24px" }}>
        <Row gutter={[16, 16]}>
          {rooms.map((room) => (
            <Col xs={24} sm={12} md={8} lg={6} key={room.id}>
              <Card
                hoverable
                onClick={() => navigate(`/rooms/${room.id}`)} // ✅ Khi bấm sẽ chuyển trang
                cover={
                  <img
                    alt={room.name}
                    src={room.imageUrl}
                    style={{
                      height: 180,
                      objectFit: "cover",
                      borderTopLeftRadius: "8px",
                      borderTopRightRadius: "8px",
                    }}
                  />
                }
              >
                <Meta
                  title={room.name}
                  description={
                    <>
                      <p>
                        <strong>Địa điểm:</strong> {room.location}
                      </p>
                      <p>
                        <strong>Quận:</strong> {room.district}
                      </p>
                      <p>
                        <strong>Sức chứa:</strong> {room.capacity} người
                      </p>
                      <p>
                        <strong>Thiết bị:</strong>
                      </p>
                      {room.equipments
                        ?.split(",")
                        .map((eq, i) => (
                          <Tag color="blue" key={i}>
                            {eq.trim()}
                          </Tag>
                        ))}
                    </>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      </div>
      <Footer />
    </>
  );
};

export default RoomsList;
