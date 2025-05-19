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
  const [tradeForm, setTradeForm] = useState({
    buyer: "",
    seller: "",
    productName: "",
    price: "",
  });
  // 신뢰점수 버튼 표시 여부를 결정하는 상태 추가
  const [isBuyer, setIsBuyer] = useState(false);

  // 알림 모달 관련 상태
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("success"); // "success", "error", "warning", "loading"

  const subscriptionRef = useRef(null);
  const processedMsgIds = useRef(new Set());

  const chatBoxRef = useRef(null);
  const navigate = useNavigate();

  // localStorage에서 사용자 정보 가져오기
  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    const userNickname = localStorage.getItem("nickname");
    const sellerNickname = localStorage.getItem("seller_nickname");

    if (userId) {
      setCurrentUserId(parseInt(userId));
    }

    // 사용자가 구매자인지 확인 (본인 닉네임과 판매자 닉네임이 다르면 구매자로 판단)
    if (userNickname && sellerNickname && userNickname !== sellerNickname) {
      setIsBuyer(true);
    } else {
      setIsBuyer(false);
    }

    // 상품 정보가 있으면 거래 폼 초기화
    if (productInfo) {
      setTradeForm((prev) => ({
        ...prev,
        productName: productInfo.title || "",
      }));
    }
  }, [productInfo]);

  // 채팅 연결 설정
  useEffect(() => {
    if (!currentUserId) return;

    let client = null;

    const connectToChat = () => {
      if (stompClient && stompClient.connected) {
        console.log("이미 STOMP에 연결되어 있습니다.");
        return;
      }

      setConnectionStatus("연결 중...");

      const socket = new SockJS("https://www.yunseo.store/ws");
      client = Stomp.over(socket);

      client.debug = null;

      client.connect(
        {},
        () => {
          console.log("🟢 STOMP 연결 완료");
          setConnectionStatus("연결됨");
          setIsConnected(true);
          setStompClient(client);

          if (subscriptionRef.current) {
            subscriptionRef.current.unsubscribe();
          }

          subscriptionRef.current = client.subscribe(`/exchange/chat.exchange/room.${roomId}`, (message) => {
            const receivedMsg = JSON.parse(message.body);

            const msgId =
              receivedMsg.id || `${receivedMsg.senderId}-${receivedMsg.content}-${receivedMsg.timestamp || Date.now()}`;

            if (processedMsgIds.current.has(msgId)) {
              console.log("중복 메시지 무시:", msgId);
              return;
            }

            processedMsgIds.current.add(msgId);
            setMessages((prevMessages) => [...prevMessages, receivedMsg]);
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
        if (subscriptionRef.current) {
          subscriptionRef.current.unsubscribe();
          subscriptionRef.current = null;
        }

        client.disconnect();
        setStompClient(null);
        setIsConnected(false);
      }
    };
  }, [roomId, currentUserId]);

  // 채팅방에 새 메시지가 추가될 때마다 스크롤을 아래로 이동
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  // 토큰 잔액 조회 함수
  const fetchTokenBalance = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const response = await fetch("https://www.wooajung.shop/blockchain/coinBalance", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        // 토큰 잔액 업데이트 이벤트 발생
        window.dispatchEvent(new CustomEvent("tokenBalanceUpdated", { detail: data.token }));
      }
    } catch (error) {
      console.error("Error fetching token balance:", error);
    }
  };

  // 알림 모달 표시 함수
  const showMessage = (title, message, type = "success") => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setShowAlertModal(true);
  };

  // 시스템 메시지 전송
  const sendSystemMessage = (content) => {
    if (!stompClient || !isConnected || !currentUserId) return;

    const systemMessage = {
      roomId: parseInt(roomId),
      senderId: 0,
      receiverId: parseInt(receiverId),
      content: content,
      type: "SYSTEM",
      timestamp: new Date().toISOString(),
    };

    stompClient.send("/app/chat.send", {}, JSON.stringify(systemMessage));
  };

  // 일반 메시지 전송
  const sendMessage = () => {
    if (!messageInput.trim() || !stompClient || !isConnected || !currentUserId) return;

    const chatMessage = {
      roomId: parseInt(roomId),
      senderId: currentUserId,
      receiverId: parseInt(receiverId),
      content: messageInput,
      type: "MESSAGE",
      timestamp: new Date().toISOString(),
    };

    stompClient.send("/app/chat.send", {}, JSON.stringify(chatMessage));
    setMessageInput("");
  };

  // Enter 키로 메시지 전송
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  // 날짜 포맷팅
  const formatMessageDate = (date) => {
    const now = new Date();
    const messageDate = new Date(date);

    // 오늘 보낸 메시지인 경우 시간만 표시
    if (
      now.getFullYear() === messageDate.getFullYear() &&
      now.getMonth() === messageDate.getMonth() &&
      now.getDate() === messageDate.getDate()
    ) {
      return messageDate.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    }

    // 올해 보낸 메시지인 경우 월/일 및 시간 표시
    if (now.getFullYear() === messageDate.getFullYear()) {
      return (
        messageDate.toLocaleDateString("ko-KR", {
          month: "short",
          day: "numeric",
        }) +
        " " +
        messageDate.toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );
    }

    // 이전 연도의 메시지는 연/월/일 및 시간 표시
    return (
      messageDate.toLocaleDateString("ko-KR") +
      " " +
      messageDate.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    );
  };

  // 메시지를 날짜별로 그룹화하는 함수
  const getMessageGroups = () => {
    const groups = [];
    let currentDate = null;

    messages.forEach((message, index) => {
      const messageDate = new Date(message.timestamp || new Date());
      const dateString = messageDate.toLocaleDateString("ko-KR");

      // 날짜가 바뀌면 새 그룹 생성
      if (dateString !== currentDate) {
        currentDate = dateString;
        groups.push({
          date: dateString,
          messages: [message],
        });
      } else {
        // 같은 날짜면 기존 그룹에 추가
        groups[groups.length - 1].messages.push(message);
      }
    });

    return groups;
  };

  const handleBackClick = () => {
    if (onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  };

  // 거래 모달 열기
  const openTradeModal = () => {
    setShowTradeModal(true);
  };

  // 거래 모달 닫기
  const closeTradeModal = () => {
    setShowTradeModal(false);
  };

  // 알림 모달 닫기
  const closeAlertModal = () => {
    setShowAlertModal(false);
  };

  // 거래 폼 입력 처리
  const handleTradeFormChange = (e) => {
    const { name, value } = e.target;
    setTradeForm({
      ...tradeForm,
      [name]: value,
    });
  };

  // 거래 생성하기
  const handleCreateTrade = async () => {
    try {
      // 필수 값 검증
      if (!tradeForm.buyer || !tradeForm.seller || !tradeForm.productName || !tradeForm.price) {
        showMessage("입력 오류", "모든 필드를 입력해주세요.", "error");
        return;
      }

      // localStorage에서 accessToken 가져오기
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        showMessage("인증 오류", "로그인이 필요합니다.", "error");
        return;
      }

      // 가격을 숫자로 변환
      const tokenValue = parseInt(tradeForm.price, 10);
      if (isNaN(tokenValue)) {
        showMessage("입력 오류", "가격은 숫자만 입력 가능합니다.", "error");
        return;
      }

      // API 호출 데이터 준비
      const escrowData = {
        buyer: tradeForm.buyer,
        seller: tradeForm.seller,
        product: tradeForm.productName,
        token: tokenValue,
      };

      console.log("거래 생성 요청 데이터:", escrowData);

      // 로딩 모달 표시
      showLoadingModal("거래를 생성하는 중입니다...");

      // API 호출
      const response = await fetch("https://www.wooajung.shop/blockchain/create_escrow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(escrowData),
      });

      // 로딩 모달 닫기
      closeModalAfterLoading();

      // 응답 텍스트 먼저 확인
      const responseText = await response.text();
      console.log("API 응답 텍스트:", responseText);

      // 응답 텍스트를 JSON으로 파싱 시도
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = { message: responseText };
      }

      // 응답 코드가 성공이 아닌 경우
      if (!response.ok) {
        // 에러 메시지 추출 및 표시
        const errorMessage = responseData.message || "거래 생성 중 오류가 발생했습니다.";
        showMessage("거래 생성 실패", errorMessage, "error");
        return;
      }

      // 토큰 잔액 업데이트 - API 호출 성공 후 실행
      fetchTokenBalance();

      // 거래 정보를 채팅방에 메시지로 전송
      if (stompClient && isConnected) {
        const tradeInfoMessage = {
          roomId: parseInt(roomId),
          senderId: 0, // 시스템 메시지로 처리
          receiverId: parseInt(receiverId),
          content: `거래가 생성되었습니다.\n상품: ${tradeForm.productName}\n가격: ${tradeForm.price} USDT\n구매자: ${tradeForm.buyer}\n판매자: ${tradeForm.seller}`,
          type: "SYSTEM",
          timestamp: new Date().toISOString(),
        };

        stompClient.send("/app/chat.send", {}, JSON.stringify(tradeInfoMessage));
      }

      // 성공 메시지 표시
      showMessage("거래 생성 성공", "거래가 성공적으로 생성되었습니다.", "success");

      // 모달 닫기
      setShowTradeModal(false);
    } catch (error) {
      // 로딩 모달 닫기 (에러 발생 시에도 닫아야 함)
      closeModalAfterLoading();

      console.error("거래 생성 중 오류 발생:", error);
      showMessage("거래 생성 실패", error.message || "거래 생성 중 오류가 발생했습니다.", "error");
    }
  };

  // 로딩 모달을 표시하는 함수
  const showLoadingModal = (message) => {
    setModalMessage(message);
    setModalType("loading");
    setShowAlertModal(true);
  };

  // 로딩 후 모달을 닫는 함수
  const closeModalAfterLoading = () => {
    setShowAlertModal(false);
  };

  // 신뢰점수 결과를 표시하는 함수
  const showTrustScoreResult = (data) => {
    const { total_score, feedback } = data;

    // 점수에 따른 타입 결정
    let resultType = "error"; // 기본값 (0~50: 빨강)

    if (total_score > 70) {
      resultType = "success"; // 70~100: 초록
    } else if (total_score > 50) {
      resultType = "warning"; // 50~70: 주황
    }

    // 결과 모달 표시
    setTimeout(() => {
      setModalTitle(`신뢰점수: ${total_score}점`);
      setModalMessage(feedback);
      setModalType(resultType);
      setShowAlertModal(true);
    }, 300); // 약간의 지연을 두어 이전 모달이 완전히 닫힌 후 표시
  };

  // 채팅방에 시스템 메시지로 신뢰점수 결과를 표시하는 기능
  const sendTrustScoreMessage = (data) => {
    if (!stompClient || !isConnected || !roomId || !receiverId) return;

    const { total_score, sentiment_score, price_reasonability, feedback } = data;

    // 등급 결정
    let trustLevel = "위험";
    let emoji = "🔴";

    if (total_score > 70) {
      trustLevel = "안전";
      emoji = "🟢";
    } else if (total_score > 50) {
      trustLevel = "주의";
      emoji = "🟠";
    }

    // 채팅 내용 구성
    const messageContent =
      `${emoji} 신뢰점수 분석 결과 ${emoji}\n\n` +
      `총점: ${total_score}점 (${trustLevel})\n` +
      `감정분석 점수: ${sentiment_score}점\n` +
      `가격합리성 점수: ${price_reasonability}점\n\n` +
      `${feedback}`;

    // 시스템 메시지 전송
    const trustScoreMessage = {
      roomId: parseInt(roomId),
      senderId: 0, // 시스템 메시지로 처리
      receiverId: parseInt(receiverId),
      content: messageContent,
      type: "SYSTEM",
      timestamp: new Date().toISOString(),
    };

    stompClient.send("/app/chat.send", {}, JSON.stringify(trustScoreMessage));
  };

  // 신뢰점수 확인 API 호출
  const checkTrustScore = async () => {
    try {
      // 각 필요한 정보를 개별적으로 확인하고 구체적인 오류 메시지 표시
      if (!currentUserId) {
        showMessage("오류", "사용자 ID 정보가 없습니다. 다시 로그인해주세요.", "error");
        return;
      }

      if (!roomId) {
        showMessage("오류", "채팅방 ID 정보가 없습니다. 페이지를 새로고침해주세요.", "error");
        return;
      }

      if (!productInfo) {
        showMessage("오류", "상품 정보가 없습니다. 페이지를 새로고침하거나 상품을 다시 선택해주세요.", "error");
        return;
      }

      if (!productInfo.token) {
        showMessage("오류", "상품 가격 정보가 없습니다. 판매자에게 가격 정보를 요청해주세요.", "error");
        return;
      }

      if (!productInfo.product) {
        // product 정보가 없어도 계속 진행하지만 콘솔에 경고 출력
        console.warn("상품명(keyword) 정보가 없습니다. 빈 값으로 계속 진행합니다.");
      }

      // product.token * 1393 계산
      const priceInKRW = productInfo.token ? Math.round(productInfo.token * 1393) : 0;

      // 요청 파라미터 로깅
      console.log("=== 신뢰점수 API 파라미터 ===");
      console.log("room_id:", roomId);
      console.log("buyer_id:", currentUserId);
      console.log("keyword:", productInfo.product || "");
      console.log("price:", priceInKRW);
      console.log("===========================");

      // 로딩 모달 표시
      showLoadingModal("상대방의 거래점수를 측정 중 입니다...");

      // API URL 구성
      const apiUrl = new URL("https://www.wooajeong.store/evaluate");
      apiUrl.searchParams.append("room_id", roomId);
      apiUrl.searchParams.append("buyer_id", currentUserId);
      apiUrl.searchParams.append("keyword", productInfo.product || "");
      apiUrl.searchParams.append("price", priceInKRW);

      console.log("신뢰점수 확인 API 호출:", apiUrl.toString());

      // API 호출
      const response = await fetch(apiUrl);
      const data = await response.json();

      // 결과를 콘솔에 출력
      console.log("신뢰점수 확인 결과:", data);

      // 로딩 모달 닫기
      closeModalAfterLoading();

      // 채팅방에 결과 메시지 보내기
      sendTrustScoreMessage(data);

      // 결과 모달 표시
      showTrustScoreResult(data);
    } catch (error) {
      console.error("신뢰점수 확인 중 오류 발생:", error);

      // 로딩 모달 닫기
      closeModalAfterLoading();

      // 오류 모달 표시
      showMessage("신뢰점수 확인 실패", "신뢰점수를 확인하는 중 오류가 발생했습니다.", "error");
    }
  };

  if (!currentUserId) {
    return <div className="loading-message">사용자 정보를 불러오는 중...</div>;
  }

  return (
    <div className="chatroom-chat-wrapper">
      <div className="chatroom-chat-header">
        <div className="chat-title">{productInfo ? productInfo.title : `안전하게 거래하세요!`}</div>
        <div className="connection-status-indicator">
          {isConnected ? <span className="connected">●</span> : <span className="disconnected">●</span>}
        </div>
      </div>

      <div className="chatroom-chat-messages-container">
        <div className="chatroom-chat-messages" ref={chatBoxRef}>
          {!isConnected && <div className="chatroom-connection-status">{connectionStatus}</div>}

          {messages.length === 0 ? (
            <div className="chatroom-loading-status">채팅을 시작해 보세요!</div>
          ) : (
            getMessageGroups().map((group, groupIndex) => (
              <div key={groupIndex}>
                <div className="chatroom-date-divider">
                  <span className="chatroom-date-text">{group.date}</span>
                </div>

                {group.messages.map((msg, msgIndex) => {
                  const isSystem = msg.type === "SYSTEM" || msg.senderId === 0;
                  const isCurrentUser = msg.senderId === currentUserId;

                  if (isSystem) {
                    return (
                      <div key={msgIndex} className="chatroom-system-message">
                        <div className="chatroom-system-content">{msg.content}</div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msgIndex}
                      className={`chatroom-chat-message-container ${
                        isCurrentUser ? "chatroom-user-message" : "chatroom-bot-message"
                      }`}
                    >
                      <div
                        className={`chatroom-chat-bubble ${
                          isCurrentUser ? "chatroom-user-bubble" : "chatroom-bot-bubble"
                        }`}
                      >
                        {msg.content}
                      </div>
                      <div className="chatroom-message-time">
                        {msg.timestamp ? formatMessageDate(msg.timestamp) : "방금 전"}
                        {isCurrentUser && msg.read && <span className="chatroom-read-status">읽음</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

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

        {/* 거래 생성하기 버튼 */}
        <div className="create-trade-button-container">
          <button className="create-trade-button" onClick={openTradeModal}>
            거래 생성하기
          </button>
        </div>
      </div>

      {/* 거래 생성 모달 */}
      {showTradeModal && (
        <div className="trade-modal-overlay">
          <div className="trade-modal">
            <div className="trade-modal-header">
              <button className="close-modal-button" onClick={closeTradeModal}>
                ×
              </button>
            </div>
            <div className="trade-modal-content">
              <div className="trade-form-group">
                <label>구매자</label>
                <div className="trade-input-group">
                  <input
                    type="text"
                    name="buyer"
                    value={tradeForm.buyer}
                    onChange={handleTradeFormChange}
                    placeholder="Start typing..."
                  />
                  <button className="trade-input-button">입력</button>
                </div>
              </div>

              <div className="trade-form-group">
                <label>판매자</label>
                <div className="trade-input-group">
                  <input
                    type="text"
                    name="seller"
                    value={tradeForm.seller}
                    onChange={handleTradeFormChange}
                    placeholder="Start typing..."
                  />
                  <button className="trade-input-button">입력</button>
                </div>
              </div>

              <div className="trade-form-group">
                <label>제품명</label>
                <div className="trade-input-group">
                  <input
                    type="text"
                    name="productName"
                    value={tradeForm.productName}
                    onChange={handleTradeFormChange}
                    placeholder="Start typing..."
                  />
                  <button className="trade-input-button">입력</button>
                </div>
              </div>

              <div className="trade-form-group">
                <label>가격</label>
                <div className="trade-input-group">
                  <input
                    type="text"
                    name="price"
                    value={tradeForm.price}
                    onChange={handleTradeFormChange}
                    placeholder="Start typing..."
                  />
                  <button className="trade-input-button">입력</button>
                </div>
              </div>

              <button className="create-trade-submit-button" onClick={handleCreateTrade}>
                생성하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 알림 모달 (성공/오류/로딩) */}
      {showAlertModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "30px",
              width: "550px",
              maxWidth: "90%",
              boxShadow: "0 6px 12px rgba(0, 0, 0, 0.15)",
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
                  top: "18px",
                  right: "18px",
                  background: "none",
                  border: "none",
                  fontSize: "28px",
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
                  fontSize: "24px",
                  fontWeight: "600",
                  marginBottom: "16px",
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
                      width: "70px",
                      height: "70px",
                      borderRadius: "50%",
                      border: "6px solid #f3f3f3",
                      borderTop: "6px solid #2196F3",
                      animation: "spin 1s linear infinite",
                    }}
                  ></div>
                  <style>{`
                    @keyframes spin {
                      0% { transform: rotate(0deg); }
                      100% { transform: rotate(360deg); }
                    }
                  `}</style>
                  <p style={{ fontSize: "18px", color: "#555", marginTop: "24px" }}>{modalMessage}</p>
                </div>
              ) : (
                <div>
                  <p
                    style={{
                      fontSize: "16px",
                      lineHeight: "1.6",
                      color: "#444",
                      marginBottom: "28px",
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
                      borderRadius: "8px",
                      padding: "14px",
                      width: "100%",
                      fontSize: "18px",
                      cursor: "pointer",
                      fontWeight: "500",
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
