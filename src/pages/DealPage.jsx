import React from "react";
import { Link } from "react-router-dom";
import Sidebar from "../component/Layout/Sidebar";
import "../styles/pages/HomePage.scss";
import DealProduct from "../component/Deal/DealProduct";

function DealPage() {
  return (
    <div className="home-page">
      <div className="sidebar-container">
        <Sidebar />
      </div>
      <div className="content-container">
        <DealProduct />
      </div>
    </div>
  );
}

export default DealPage;
