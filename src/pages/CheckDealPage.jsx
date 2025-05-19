import React from "react";
import { Link } from "react-router-dom";
import Sidebar from "../component/Layout/Sidebar";
import "../styles/pages/HomePage.scss";
import DealList from "../component/Deal/DealList";

function CheckDealPage() {
  return (
    <div className="home-page">
      <div className="sidebar-container">
        <Sidebar />
      </div>
      <div className="content-container">
        <DealList />
      </div>
    </div>
  );
}

export default CheckDealPage;
