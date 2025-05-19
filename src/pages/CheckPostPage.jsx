import React from "react";
import { Link } from "react-router-dom";
import Sidebar from "../component/Layout/Sidebar";
import "../styles/pages/HomePage.scss";
import DealList from "../component/Deal/DealList";
import CheckPost from "../component/Deal/CheckPost";

function CheckPostPage() {
  return (
    <div className="home-page">
      <div className="sidebar-container">
        <Sidebar />
      </div>
      <div className="content-container">
        <CheckPost />
      </div>
    </div>
  );
}

export default CheckPostPage;
