import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import "../../styles/layout/Sidebar.scss";

function Layout() {
  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
