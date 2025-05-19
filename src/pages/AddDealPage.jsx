import React from "react";
import { Link } from "react-router-dom";
import Sidebar from "../component/Layout/Sidebar";
import "../styles/pages/HomePage.scss";
import AddDeal from "../component/Deal/AddDeal";

function AddDealPage() {
  return (
    <div className="home-page">
      <div className="sidebar-container">
        <Sidebar />
      </div>
      <div className="content-container">
        <AddDeal />
      </div>
    </div>
  );
}

export default AddDealPage;
