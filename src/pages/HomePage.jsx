import React from "react";
import { Link } from "react-router-dom";
import Ai_chat from "../component/ai_chat/Ai_chat";
import Sidebar from "../component/Layout/Sidebar";
import "../styles/pages/HomePage.scss";

function HomePage() {
  return (
    <div className="home-page">
      <div className="sidebar-container">
        <Sidebar />
      </div>
      <div className="content-container">
        <Ai_chat />
      </div>
    </div>
  );
}

export default HomePage;
