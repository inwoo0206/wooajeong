import React from "react";
import { Link } from "react-router-dom";
import Sidebar from "../component/Layout/Sidebar";
import "../styles/pages/HomePage.scss";
import Profile from "../component/Profile/Profile";

function ProfilePage() {
  return (
    <div className="home-page">
      <div className="sidebar-container">
        <Sidebar />
      </div>
      <div className="content-container">
        <Profile />
      </div>
    </div>
  );
}

export default ProfilePage;
