import React from "react";
import { useParams } from "react-router-dom";
import ChattingList from "../component/Chat/ChattingList";
import Sidebar from "../component/Layout/Sidebar";
import "../styles/pages/HomePage.scss"; // HomePage 스타일 재사용

const ChatRoomPage = () => {
  const { roomId } = useParams();

  return (
    <div className="home-page">
      <div className="sidebar-container">
        <Sidebar />
      </div>
      <div className="content-container">
        <ChattingList roomId={roomId} />
      </div>
    </div>
  );
};

export default ChatRoomPage;
