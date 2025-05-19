import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/components/ChatList.scss";
import chatroom_icon from "../../assets/chatroom_icon.svg";
import chat_img from "../../assets/chatimg.svg";

const ChatList = () => {
  const navigate = useNavigate();
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 날짜를 사용자 친화적인 형식으로 변환하는 함수
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) {
      return "방금 전";
    } else if (diffMin < 60) {
      return `${diffMin}분 전`;
    } else if (diffHour < 24) {
      return `${diffHour}시간 전`;
    } else if (diffDay < 7) {
      return `${diffDay}일 전`;
    } else {
      // 년-월-일 형식으로 표시
      return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
    }
  };

  useEffect(() => {
    const fetchChatRooms = async () => {
      setLoading(true);
      try {
        // localStorage에서 accessToken 가져오기
        const accessToken = localStorage.getItem("accessToken");
        if (!accessToken) {
          throw new Error("로그인이 필요합니다.");
        }

        const response = await fetch("https://www.yunseo.store/room/my", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("채팅방 목록을 불러오는데 실패했습니다.");
        }

        const data = await response.json();
        console.log("채팅방 목록:", data);

        // API 응답 데이터를 UI에 맞게 변환 (날짜 형식 변환 포함)
        const formattedRooms = data.map((room) => ({
          id: room.roomId,
          title: "새로운 채팅이 도착했습니다.",
          time: formatDate(room.createdAt), // 날짜 형식 변환
          originalTime: room.createdAt, // 원본 시간도 보관 (정렬 등에 활용 가능)
          imageUrl: chat_img,
        }));

        setChatRooms(formattedRooms);
      } catch (err) {
        console.error("채팅방 목록 불러오기 오류:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchChatRooms();
  }, []);

  const goToRoom = (roomId) => {
    navigate(`/chat/${roomId}`);
  };

  if (loading) {
    return <div className="chat-list-loading">채팅방 목록을 불러오는 중...</div>;
  }

  if (error) {
    return <div className="chat-list-error">{error}</div>;
  }

  return (
    <div className="chat-list-main-container">
      <div className="chat-list-title">AI로 안전하고 스마트한 중고거래 경험을 만나보세요!</div>
      <div className="chat-list-container">
        {chatRooms.length > 0 ? (
          chatRooms.map((room) => (
            <div className="chat-room-item" key={room.id} onClick={() => goToRoom(room.id)}>
              <div className="chat-room-left">
                <img src={room.imageUrl} alt={room.title} className="chat-room-image" />
                <div className="chat-room-info">
                  <div className="chat-room-title">{room.title}</div>
                  <div className="chat-room-time">채팅을 확인해보세요!</div>
                </div>
              </div>
              <div className="chat-room-badge">
                <img src={chatroom_icon} alt="chatroom 아이콘" />
              </div>
            </div>
          ))
        ) : (
          <div className="no-chat-rooms">아직 채팅방이 없습니다.</div>
        )}
      </div>
    </div>
  );
};

export default ChatList;
