import React from "react";
import { Link } from "react-router-dom";
import Sidebar from "../component/Layout/Sidebar";
import "../styles/pages/HomePage.scss";
import ChatList from "../component/Chat/ChatList";

function ChatPage() {
  return (
    <div className="home-page">
      <div className="sidebar-container">
        <Sidebar />
      </div>
      <div className="content-container">
        <ChatList />
      </div>
    </div>
  );
}

export default ChatPage;
