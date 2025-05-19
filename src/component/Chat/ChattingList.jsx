import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import SockJS from "sockjs-client";
import Stomp from "stompjs";
import "../../styles/components/ChattingList.scss";

const ChattingList = ({ roomId, receiverId, productInfo, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [stompClient, setStompClient] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("연결 중...");
  const [isConnected, setIsConnected] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeForm, setTradeForm] = useState({ buyer: "", seller: "", productName: "", price: "" });
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("success");
  const [sellerName, setSellerName] = useState("");

  const subscriptionRef = useRef(null);
  const processedMsgIds = useRef(new Set());
  const chatBoxRef = useRef(null);
  const navigate = useNavigate();

  // 현재 사용자 ID와 거래 상품 초기화
  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    if (userId) setCurrentUserId(parseInt(userId, 10));
    if (productInfo) setTradeForm((prev) => ({ ...prev, productName: productInfo.title || "" }));
  }, [productInfo]);

  // roomId로 상품 상세 조회 및 판매자 닉네임 저장
  useEffect(() => {
    if (!roomId) return;
    const fetchDetail = async () => {
      try {
        const resp = await fetch(`https://www.wooajung.shop/junggo/junggo_detail?product_id=${roomId}`);
        const json = await resp.json();
        if (json.data) {
          const nick = json.data.nickname;
          localStorage.setItem("seller_name", nick);
          setSellerName(nick);
        }
      } catch (err) {
        console.error("상품 정보 조회 오류:", err);
      }
    };
    fetchDetail();
  }, [roomId]);

  // STOMP 연결 설정
  useEffect(() => {
    if (!currentUserId) return;
    let client = null;
    const connectToChat = () => {
      if (stompClient && stompClient.connected) return;
      setConnectionStatus("연결 중...");
      const socket = new SockJS("https://www.yunseo.store/ws");
      client = Stomp.over(socket);
      client.debug = null;
      client.connect(
        {},
        () => {
          setConnectionStatus("연결됨");
          setIsConnected(true);
          setStompClient(client);
          if (subscriptionRef.current) subscriptionRef.current.unsubscribe();
          subscriptionRef.current = client.subscribe(`/exchange/chat.exchange/room.${roomId}`, (msg) => {
            const received = JSON.parse(msg.body);
            const msgId = received.id || `${received.senderId}-${received.content}-${received.timestamp || Date.now()}`;
            if (processedMsgIds.current.has(msgId)) return;
            processedMsgIds.current.add(msgId);
            setMessages((prev) => [...prev, received]);
          });
        },
        (error) => {
          console.error("STOMP 연결 실패:", error);
          setConnectionStatus("연결 실패. 재시도 중...");
          setIsConnected(false);
          setTimeout(connectToChat, 3000);
        }
      );
    };
    connectToChat();
    return () => {
      if (client && client.connected) {
        if (subscriptionRef.current) subscriptionRef.current.unsubscribe();
        client.disconnect();
      }
      setStompClient(null);
      setIsConnected(false);
    };
  }, [roomId, currentUserId]);

  // 자동 스크롤
  useEffect(() => {
    if (chatBoxRef.current) chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
  }, [messages]);

  // 알림 모달 표시
  const showMessage = (title, message, type = "success") => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setShowAlertModal(true);
  };

  // 일반 메시지 전송
  const sendMessage = () => {
    if (!messageInput.trim() || !stompClient || !isConnected || !currentUserId) return;
    const chat = {
      roomId: parseInt(roomId, 10),
      senderId: currentUserId,
      receiverId: parseInt(receiverId, 10),
      content: messageInput,
      type: "MESSAGE",
      timestamp: new Date().toISOString(),
    };
    stompClient.send("/app/chat.send", {}, JSON.stringify(chat));
    setMessageInput("");
  };
  const handleKeyPress = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  // 날짜 포맷팅
  const formatMessageDate = (date) => {
    const now = new Date();
    const msgDate = new Date(date);
    if (now.toDateString() === msgDate.toDateString()) {
      return msgDate.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: true });
    }
    if (now.getFullYear() === msgDate.getFullYear()) {
      return (
        msgDate.toLocaleDateString("ko-KR", { month: "short", day: "numeric" }) +
        " " +
        msgDate.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: true })
      );
    }
    return (
      msgDate.toLocaleDateString("ko-KR") +
      " " +
      msgDate.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: true })
    );
  };

  // 메시지 날짜별 그룹화
  const getMessageGroups = () => {
    const groups = [];
    let currentDate = null;
    messages.forEach((msg) => {
      const dateKey = new Date(msg.timestamp || Date.now()).toLocaleDateString("ko-KR");
      if (dateKey !== currentDate) {
        currentDate = dateKey;
        groups.push({ date: dateKey, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });
    return groups;
  };

  // 거래 모달 열기/닫기
  const openTradeModal = () => setShowTradeModal(true);
  const closeTradeModal = () => setShowTradeModal(false);

  // 알림 모달 닫기
  const closeAlertModal = () => setShowAlertModal(false);

  // 거래 폼 입력 처리
  const handleTradeFormChange = (e) => {
    const { name, value } = e.target;
    setTradeForm((prev) => ({ ...prev, [name]: value }));
  };

  // 거래 생성 API 호출
  const handleCreateTrade = async () => {
    try {
      const { buyer, seller, productName, price } = tradeForm;
      if (!buyer || !seller || !productName || !price) {
        showMessage("입력 오류", "모든 필드를 입력해주세요.", "error");
        return;
      }
      const token = localStorage.getItem("accessToken");
      if (!token) {
        showMessage("인증 오류", "로그인이 필요합니다.", "error");
        return;
      }
      const tokenValue = parseInt(price, 10);
      if (isNaN(tokenValue)) {
        showMessage("입력 오류", "가격은 숫자만 입력 가능합니다.", "error");
        return;
      }
      const escrow = { buyer, seller, product: productName, token: tokenValue };
      console.log("거래 생성 요청:", escrow);
      const res = await fetch("https://www.wooajung.shop/blockchain/create_escrow", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(escrow),
      });
      const text = await res.text();
      console.log("API 응답 텍스트:", text);
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }
      if (!res.ok) {
        showMessage("거래 생성 실패", data.message || "오류 발생", "error");
        return;
      }
      if (stompClient && isConnected) {
        const sysMsg = {
          roomId: parseInt(roomId, 10),
          senderId: 0,
          receiverId: parseInt(receiverId, 10),
          content: `거래가 생성되었습니다.\n상품: ${productName}\n가격: ${price} USDT\n구매자: ${buyer}\n판매자: ${seller}`,
          type: "SYSTEM",
          timestamp: new Date().toISOString(),
        };
        stompClient.send("/app/chat.send", {}, JSON.stringify(sysMsg));
      }
      showMessage("거래 생성 성공", "거래가 성공적으로 생성되었습니다.", "success");
      closeTradeModal();
    } catch (err) {
      console.error(err);
      showMessage("거래 생성 실패", err.message || "오류 발생", "error");
    }
  };

  // 로딩 모달 타입 처리
  const showLoadingModal = (message) => {
    setModalTitle("신뢰점수 확인 중");
    setModalMessage(message);
    setModalType("loading");
    setShowAlertModal(true);
  };
  const closeModalAfterLoading = () => setShowAlertModal(false);

  // 신뢰 점수 결과 표시
  const showTrustScoreResult = (data) => {
    const { total_score, feedback } = data;
    let type = total_score > 70 ? "success" : total_score > 50 ? "warning" : "error";
    setTimeout(() => {
      setModalTitle(`신뢰점수: ${total_score}점`);
      setModalMessage(feedback);
      setModalType(type);
      setShowAlertModal(true);
    }, 300);
  };

  // 시스템 메시지 전송 함수(신뢰점수)
  const sendTrustScoreMessage = (data) => {
    if (!stompClient || !isConnected) return;
    const { total_score, sentiment_score, price_reasonability, feedback } = data;
    let level = total_score > 70 ? "안전" : total_score > 50 ? "주의" : "위험";
    let emoji = total_score > 70 ? "🟢" : total_score > 50 ? "🟠" : "🔴";
    const content = `${emoji} 신뢰점수 분석 결과 ${emoji}\n\n총점: ${total_score}점 (${level})\n감정분석: ${sentiment_score}점\n가격합리성: ${price_reasonability}점\n\n${feedback}`;
    const msg = {
      roomId: parseInt(roomId, 10),
      senderId: 0,
      receiverId: parseInt(receiverId, 10),
      content,
      type: "SYSTEM",
      timestamp: new Date().toISOString(),
    };
    stompClient.send("/app/chat.send", {}, JSON.stringify(msg));
  };

  // 신뢰점수 확인 API 호출
  const checkTrustScore = async () => {
    if (!currentUserId) {
      showMessage("오류", "사용자 ID 정보가 없습니다.", "error");
      return;
    }
    if (!roomId) {
      showMessage("오류", "채팅방 ID가 없습니다.", "error");
      return;
    }
    if (!productInfo || !productInfo.token) {
      showMessage("오류", "상품 정보가 없습니다.", "error");
      return;
    }
    const priceKRW = Math.round(productInfo.token * 1393);
    showLoadingModal("상대방의 거래점수를 측정 중 입니다...");
    try {
      const url = new URL("https://www.wooajeong.store/evaluate");
      url.searchParams.append("room_id", roomId);
      url.searchParams.append("buyer_id", currentUserId);
      url.searchParams.append("keyword", productInfo.product || "");
      url.searchParams.append("price", priceKRW);
      const res = await fetch(url);
      const data = await res.json();
      closeModalAfterLoading();
      sendTrustScoreMessage(data);
      showTrustScoreResult(data);
    } catch (err) {
      console.error(err);
      closeModalAfterLoading();
      showMessage("신뢰점수 확인 실패", "오류가 발생했습니다.", "error");
    }
  };

  const localNickname = localStorage.getItem("nickname");

  if (!currentUserId) return <div className="loading-message">사용자 정보를 불러오는 중...</div>;

  return (
    <div className="chatroom-chat-wrapper">
      {/* 채팅 헤더 */}
      <div className="chatroom-chat-header">
        <div className="chat-title">{productInfo ? productInfo.title : "안전하게 거래하세요!"}</div>
        <div className="connection-status-indicator">
          {isConnected ? <span className="connected">●</span> : <span className="disconnected">●</span>}
        </div>
      </div>

      {/* 채팅 메시지 영역 */}
      <div className="chatroom-chat-messages-container">
        <div className="chatroom-chat-messages" ref={chatBoxRef}>
          {!isConnected && <div className="chatroom-connection-status">{connectionStatus}</div>}
          {messages.length === 0 ? (
            <div className="chatroom-loading-status">채팅을 시작해 보세요!</div>
          ) : (
            getMessageGroups().map((group, gi) => (
              <div key={gi}>
                <div className="chatroom-date-divider">
                  <span className="chatroom-date-text">{group.date}</span>
                </div>
                {group.messages.map((msg, mi) => {
                  const isSystem = msg.type === "SYSTEM" || msg.senderId === 0;
                  const isMe = msg.senderId === currentUserId;
                  return isSystem ? (
                    <div key={mi} className="chatroom-system-message">
                      <div className="chatroom-system-content">{msg.content}</div>
                    </div>
                  ) : (
                    <div
                      key={mi}
                      className={`chatroom-chat-message-container ${
                        isMe ? "chatroom-user-message" : "chatroom-bot-message"
                      }`}
                    >
                      <div className={`chatroom-chat-bubble ${isMe ? "chatroom-user-bubble" : "chatroom-bot-bubble"}`}>
                        {msg.content}
                      </div>
                      <div className="chatroom-message-time">
                        {msg.timestamp ? formatMessageDate(msg.timestamp) : "방금 전"}
                        {isMe && msg.read && <span className="chatroom-read-status">읽음</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* 메시지 입력 및 전송 */}
        <div className="chat-input-container">
          <input
            type="text"
            className="chat-input-field"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="메시지를 입력하세요..."
            disabled={!isConnected}
          />
          <button className="chat-send-button" onClick={sendMessage} disabled={!isConnected || !messageInput.trim()}>
            전송
          </button>
        </div>

        {/* 신뢰점수 확인 버튼 (판매자 아닌 경우에만) */}
        {localNickname !== sellerName && (
          <div className="trust-score-button-container">
            <button className="trust-score-button" onClick={checkTrustScore}>
              신뢰점수 확인
            </button>
          </div>
        )}

        {/* 거래 생성 버튼 */}
        <div className="create-trade-button-container">
          <button className="create-trade-button" onClick={openTradeModal}>
            거래 생성하기
          </button>
        </div>
      </div>

      {/* 거래 모달 */}
      {showTradeModal && (
        <div className="trade-modal-overlay">
          <div className="trade-modal">
            <div className="trade-modal-header">
              <button className="close-modal-button" onClick={closeTradeModal}>
                ×
              </button>
            </div>
            <div className="trade-modal-content">
              {/** 구매자, 판매자, 제품명, 가격 입력 폼 **/}
              {[
                { label: "구매자", name: "buyer" },
                { label: "판매자", name: "seller" },
                { label: "제품명", name: "productName" },
                { label: "가격", name: "price" },
              ].map((f, i) => (
                <div key={i} className="trade-form-group">
                  <label>{f.label}</label>
                  <div className="trade-input-group">
                    <input
                      type="text"
                      name={f.name}
                      value={tradeForm[f.name]}
                      onChange={handleTradeFormChange}
                      placeholder="Start typing..."
                    />
                    <button className="trade-input-button">입력</button>
                  </div>
                </div>
              ))}
              <button className="create-trade-submit-button" onClick={handleCreateTrade}>
                생성하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 알림 모달 */}
      {showAlertModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: 12,
              padding: 30,
              width: 550,
              maxWidth: "90%",
              boxShadow: "0 6px 12px rgba(0,0,0,0.15)",
              position: "relative",
              borderTop:
                modalType === "success"
                  ? "6px solid #4CAF50"
                  : modalType === "warning"
                  ? "6px solid #FF9800"
                  : modalType === "error"
                  ? "6px solid #ff6b6b"
                  : modalType === "loading"
                  ? "6px solid #2196F3"
                  : "6px solid #333",
            }}
          >
            {modalType !== "loading" && (
              <button
                style={{
                  position: "absolute",
                  top: 18,
                  right: 18,
                  background: "none",
                  border: "none",
                  fontSize: 28,
                  cursor: "pointer",
                  padding: 0,
                }}
                onClick={closeAlertModal}
              >
                ×
              </button>
            )}
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <h2
                style={{
                  fontSize: 24,
                  fontWeight: 600,
                  marginBottom: 16,
                  color:
                    modalType === "error"
                      ? "#ff6b6b"
                      : modalType === "warning"
                      ? "#FF9800"
                      : modalType === "success"
                      ? "#4CAF50"
                      : modalType === "loading"
                      ? "#2196F3"
                      : "#333",
                }}
              >
                {modalTitle}
              </h2>
              {modalType === "loading" ? (
                <div>
                  <div
                    style={{
                      margin: "24px auto",
                      width: 70,
                      height: 70,
                      borderRadius: "50%",
                      border: "6px solid #f3f3f3",
                      borderTop: "6px solid #2196F3",
                      animation: "spin 1s linear infinite",
                    }}
                  ></div>
                  <style>{`@keyframes spin {0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}`}</style>
                  <p style={{ fontSize: 18, color: "#555", marginTop: 24 }}>{modalMessage}</p>
                </div>
              ) : (
                <div>
                  <p
                    style={{
                      fontSize: 16,
                      lineHeight: 1.6,
                      color: "#444",
                      marginBottom: 28,
                      whiteSpace: "pre-line",
                      textAlign: "left",
                    }}
                  >
                    {modalMessage}
                  </p>
                  <button
                    style={{
                      backgroundColor:
                        modalType === "error"
                          ? "#ff6b6b"
                          : modalType === "warning"
                          ? "#FF9800"
                          : modalType === "success"
                          ? "#4CAF50"
                          : "#6c7aee",
                      color: "white",
                      border: "none",
                      borderRadius: 8,
                      padding: 14,
                      width: "100%",
                      fontSize: 18,
                      cursor: "pointer",
                      fontWeight: 500,
                    }}
                    onClick={closeAlertModal}
                  >
                    확인
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChattingList;
