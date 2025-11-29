import React from "react";
import { UserOutlined } from "@ant-design/icons"; // Import icon từ Ant Design
import "./Header.css";

function Header() {
  const user = sessionStorage.getItem("user");
  const username = user.name
  return (
    <header className="header">
      <div className="header__left">
        <h1>Welcome to Admin</h1>
      </div>
      <div className="header__right">
        <div className="header__user-info">
          {/* Thay Avatar bằng Icon UserOutlined */}
          <UserOutlined style={{ fontSize: "40px", color: "black" }} />
          <span className="username">{username}</span>
        </div>
      </div>
    </header>
  );
}

export default Header;
