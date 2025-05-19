import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import ChatInput from "../Common/ChatInput";
import "../../styles/components/Ai_chat.scss";

const Ai_Location = () => {
  const [isLogged, setIsLogged] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const pingIntervalRef = useRef(null); // ping 간격을 저장할 ref
  const reconnectTimeoutRef = useRef(null); // 재연결 타임아웃을 저장할 ref
  const maxReconnectAttempts = 5; // 최대 재연결 시도 횟수
  const reconnectAttemptsRef = useRef(0); // 재연결 시도 횟수를 저장할 ref

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getToken = async () => {
    try {
      const accessToken = sessionStorage.getItem("accessToken");
      console.log("getToken 함수 호출, 기존 토큰:", accessToken ? "있음" : "없음");

      const response = await axios.post(
        "http://34.9.146.135/api/token",
        { user_id: "jjang" },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      console.log("토큰 API 응답:", response.status);

      const token = response.data.token;
      console.log("새 토큰 발급 성공 (앞 10자리):", token.substring(0, 10) + "...");

      sessionStorage.setItem("accessToken", token);
      return token;
    } catch (error) {
      console.error("토큰 발급 오류:", error);
      console.error("오류 상세:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      return null;
    }
  };

  // 웹소켓 연결 시 ping 타이머 설정
  const setupPingInterval = () => {
    // 기존 ping 간격이 있으면 제거
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }

    // 30초마다 ping 메시지 전송
    pingIntervalRef.current = setInterval(() => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        console.log("Sending ping to keep connection alive");
        socketRef.current.send(JSON.stringify({ type: "ping" }));
      } else {
        // 소켓이 닫혀있다면 로그 출력만 (재연결은 handleSend에서 처리)
        console.log("WebSocket closed during ping");
      }
    }, 30000); // 30초마다 ping
  };

  // 웹소켓 재연결 로직 (참고용으로 유지, 실제로는 사용하지 않음)
  const reconnectWebSocket = () => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.log(`Maximum reconnect attempts (${maxReconnectAttempts}) reached, giving up`);
      reconnectAttemptsRef.current = 0;
      return;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectAttemptsRef.current += 1;
    const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000); // 지수 백오프, 최대 30초

    console.log(`Attempting to reconnect in ${delay / 1000} seconds (attempt ${reconnectAttemptsRef.current})`);
    reconnectTimeoutRef.current = setTimeout(() => {
      // handleSend에서 재연결 처리하므로 여기서는 로그만 출력
      console.log("자동 재연결 시간 도달");
    }, delay);
  };

  useEffect(() => {
    const fetchToken = async () => {
      const token = await getToken();
      console.log("초기 토큰 발급 결과:", token ? "성공" : "실패");
    };
    fetchToken();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 컴포넌트 언마운트 시 정리 작업
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  // rawText 파싱 함수
  const parseProductsFromRawText = (rawText) => {
    console.log("상품 목록 파싱 시작");

    // JSON 부분과 상품 목록 부분 분리
    const jsonMatch = rawText.match(/^\{.*?\}/);
    let keyword = "";

    if (jsonMatch) {
      try {
        const jsonData = JSON.parse(jsonMatch[0]);
        keyword = jsonData.keyword || "";
        console.log("키워드 파싱 성공:", keyword);
      } catch (err) {
        console.error("JSON 파싱 오류:", err);
      }
    } else {
      console.log("JSON 형식 데이터 없음");
    }

    // 각 상품 항목 분리를 위한 정규식
    const productBlocksRegex = /(\d+\.\s+\*\*.*?\*\*[\s\S]*?)(?=\d+\.\s+\*\*|원하는 매물을|$)/g;
    const productBlocks = [];
    let productMatch;

    while ((productMatch = productBlocksRegex.exec(rawText)) !== null) {
      productBlocks.push(productMatch[1].trim());
    }

    console.log("상품 블록 수:", productBlocks.length);

    // 각 상품 블록에서 상세 정보 추출
    const products = productBlocks.map((block, index) => {
      // 상품명 추출
      const nameMatch = block.match(/\*\*(.*?)\*\*/);
      const name = nameMatch ? nameMatch[1].trim() : `상품 ${index + 1}`;

      // 가격 추출
      const priceMatch = block.match(/가격:\s+([\d,]+원)/);
      const price = priceMatch ? priceMatch[1] : "가격 정보 없음";

      // 상품 링크 추출 - 제목에서 링크 추출 (https://web.joongna.com/product/XXXXX) 형식
      let link = "";
      const linkMatch = block.match(/\(https:\/\/web\.joongna\.com\/product\/\d+\)/);
      if (linkMatch) {
        // 괄호 제거
        link = linkMatch[0].replace(/[()]/g, "");
      }

      // 이미지 URL 추출 - 수정된 정규식
      const imageMatch = block.match(/\(https:\/\/img2\.joongna\.com\/media\/original\/.*?\.jpg/);
      const image = imageMatch ? imageMatch[0].replace(/[()]/g, "") : "";

      console.log(`상품 ${index + 1} 파싱:`, {
        name,
        price,
        image: image ? "있음" : "없음",
        link: link ? "있음" : "없음",
      });

      return {
        id: index + 1,
        name,
        price,
        image,
        link,
      };
    });

    console.log("상품 파싱 완료, 총", products.length, "개");
    return { keyword, products };
  };

  // 응답 메시지 처리 함수
  const processResponseMessage = (rawText) => {
    console.log("processResponseMessage 함수 시작 - rawText 분석:");
    console.log("📌 상품 목록 패턴 검사:", /\d+\.\s+\*\*.*?\*\*/.test(rawText));

    // "처리 중" 메시지 제거
    setMessages((prev) => prev.filter((msg) => !msg.isProcessing));

    // 상품 목록 형식인지 확인 (숫자 + 별표 형식)
    const isProductList = /\d+\.\s+\*\*.*?\*\*/.test(rawText);

    if (isProductList) {
      // 상품 목록 형식인 경우
      console.log("📌 상품 목록 형식 감지됨");
      const { keyword, products } = parseProductsFromRawText(rawText);
      console.log("📌 파싱 결과 - 키워드:", keyword);
      console.log("📌 파싱 결과 - 상품 수:", products.length);
      console.log("📌 파싱 결과 - 상품 전체:", products);

      if (products.length > 0) {
        // 검색어가 있으면 표시
        if (keyword) {
          setMessages((prev) => [
            ...prev,
            {
              id: prev.length + 1,
              text: `"${keyword}" 관련 추천 상품 ${products.length}개를 찾았습니다.`,
              isUser: false,
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: prev.length + 1,
              text: `추천 상품 ${products.length}개를 찾았습니다.`,
              isUser: false,
            },
          ]);
        }

        // 상품 목록 추가
        setMessages((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            isUser: false,
            isProductList: true,
            products,
          },
        ]);
      } else {
        // 상품 목록 형식이지만 상품이 없는 경우
        console.log("📌 상품 목록 형식이지만 상품이 없음");
        setMessages((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            text: "상품을 찾을 수 없습니다.",
            isUser: false,
          },
        ]);
      }
    } else {
      // 일반 텍스트 메시지인 경우, 원본 그대로 표시
      console.log("📌 일반 텍스트 메시지로 처리");
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          text: rawText,
          isUser: false,
        },
      ]);
    }

    setIsLoading(false);
  };

  // 메시지 전송 및 WebSocket 연결 함수 (개선됨)
  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const messageToSend = inputText.trim(); // 보낼 메시지 저장

    setMessages((prev) => [...prev, { id: prev.length + 1, text: messageToSend, isUser: true }]);
    setInputText("");
    setIsLoading(true);

    try {
      console.log("전송 버튼 클릭, 메시지:", messageToSend);

      // 토큰 유효성 확인
      let token = sessionStorage.getItem("accessToken");
      if (!token) {
        console.log("저장된 토큰 없음, 새 토큰 요청 중...");
        token = await getToken();
        if (!token) {
          console.error("토큰 발급 실패");
          setMessages((prev) => [
            ...prev,
            { id: prev.length + 1, text: "토큰 발급에 실패했습니다. 다시 시도해주세요.", isUser: false },
          ]);
          setIsLoading(false);
          throw new Error("토큰 발급 실패");
        }
        console.log("새 토큰 발급 성공 (앞 10자리):", token.substring(0, 10) + "...");
      } else {
        console.log("기존 토큰 사용 (앞 10자리):", token.substring(0, 10) + "...");
      }

      // 기존 WebSocket 연결 확인 및 필요 시 닫기
      if (socketRef.current) {
        if (socketRef.current.readyState === WebSocket.OPEN) {
          console.log("기존 WebSocket 연결이 열려있어 닫습니다.");
          socketRef.current.close();
        } else if (socketRef.current.readyState === WebSocket.CONNECTING) {
          console.log("WebSocket 연결 중... 연결 대기");
          // 연결 중인 경우 잠시 대기
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      // WebSocket URL 생성 및 로깅
      const socketUrl = `ws://34.9.146.135/ws/solchat?token=${token}`;
      console.log("WebSocket 연결 URL:", socketUrl);

      // 새 WebSocket 연결 시도
      console.log("새 WebSocket 연결 시도 중...");
      socketRef.current = new WebSocket(socketUrl);

      // WebSocket 이벤트 핸들러 설정
      socketRef.current.onopen = () => {
        console.log("✅ WebSocket 연결 성공! 메시지 전송 준비 완료");

        // 메시지 전송
        console.log(`메시지 전송: "${messageToSend}"`);
        const payload = JSON.stringify({ message: messageToSend });
        socketRef.current.send(payload);

        // ping 간격 설정
        setupPingInterval();
      };

      socketRef.current.onmessage = (event) => {
        console.log("✅ WebSocket 메시지 수신:", event.data.substring(0, 100) + "...");
        try {
          const response = JSON.parse(event.data);
          console.log("WebSocket 응답 전체:", response);

          // ping 응답 처리
          if (response.type === "pong") {
            console.log("Received pong from server");
            return;
          }

          // type이 "token"인 경우 메시지 누적 및 UI에 실시간 업데이트
          if (response.type === "token" && response.data) {
            console.log("Token 응답 데이터 수신:", response);

            // delta 값 추출 - ResponseTextDeltaEvent에서 delta='...' 형식으로 오는 값 파싱
            let deltaText = "";
            const deltaMatch = response.data.match(/delta='([^']*?)'/);
            if (deltaMatch && deltaMatch[1]) {
              deltaText = deltaMatch[1];
              console.log("추출된 delta 텍스트:", deltaText);
            } else {
              console.log("delta 텍스트를 찾을 수 없음");
              return; // delta 값이 없으면 처리하지 않음
            }

            // socketRef에 누적 텍스트 저장 (영구 저장)
            if (!socketRef.current.accumulatedText) {
              socketRef.current.accumulatedText = "";
            }
            socketRef.current.accumulatedText += deltaText;

            console.log("📌 누적된 token 메시지:", socketRef.current.accumulatedText);

            // 초기 JSON 부분을 건너뛰고 스트리밍 여부 확인 (JSON만 들어온 경우 표시하지 않음)
            const isJsonOnly =
              socketRef.current.accumulatedText.trim().startsWith('{"keyword":') &&
              !socketRef.current.accumulatedText.includes("추천할");

            if (!isJsonOnly) {
              // JSON 부분 제외하고 실제 표시할 내용 추출
              let displayText = socketRef.current.accumulatedText;
              const jsonMatch = displayText.match(/^\{.*?\}/);
              if (jsonMatch) {
                displayText = displayText.substring(jsonMatch[0].length).trim();
              }

              // UI에 실시간으로 누적된 텍스트 반영
              setMessages((prev) => {
                // 이미 스트리밍 중인 메시지가 있는지 확인
                const streamingMsgIndex = prev.findIndex((msg) => msg.isStreaming);

                if (streamingMsgIndex >= 0) {
                  // 스트리밍 중인 메시지가 있으면 해당 메시지 업데이트
                  const updatedMessages = [...prev];
                  updatedMessages[streamingMsgIndex] = {
                    ...updatedMessages[streamingMsgIndex],
                    text: displayText,
                  };
                  return updatedMessages;
                } else {
                  // 스트리밍 중인 메시지가 없으면 새로 추가
                  return [
                    ...prev,
                    {
                      id: prev.length + 1,
                      text: displayText,
                      isUser: false,
                      isStreaming: true, // 스트리밍 중임을 표시하는 플래그
                    },
                  ];
                }
              });
            }
          }
          // 최종 완료 메시지가 오면 누적된 텍스트를 처리
          else if (response.type === "complete") {
            console.log("Complete 응답 수신 - 누적된 메시지 처리");

            // 누적된 텍스트 가져오기
            const accumulatedText = socketRef.current.accumulatedText || "";

            // 스트리밍 중인 메시지 플래그 제거 (완료됨을 표시)
            setMessages((prev) => {
              const updatedMessages = prev.map((msg) => (msg.isStreaming ? { ...msg, isStreaming: false } : msg));
              return updatedMessages;
            });

            // 누적된 텍스트가 있고 JSON 형식으로 시작한다면 파싱
            if (accumulatedText && accumulatedText.startsWith('{"keyword":')) {
              console.log(
                "📌 keyword 형식의 누적 메시지 처리 (처음 200자):",
                accumulatedText.substring(0, 200) + (accumulatedText.length > 200 ? "..." : "")
              );

              // 누적된 메시지 처리
              processResponseMessage(accumulatedText);
            }
            // 일반 텍스트이거나 누적된 텍스트가 비어있는 경우 (기존 complete 처리 방식 유지)
            else if (response.message) {
              console.log("일반 텍스트 메시지:", response.message.substring(0, 100) + "...");
              setMessages((prev) => [
                ...prev,
                {
                  id: prev.length + 1,
                  text: response.message,
                  isUser: false,
                },
              ]);
            } else if (accumulatedText) {
              // 스트리밍 중인 메시지가 이미 표시되어 있으므로 추가 작업 필요 없음
              console.log("누적된 일반 텍스트 메시지 완료:", accumulatedText.substring(0, 100) + "...");
            } else {
              // complete 메시지만 있고 내용이 없는 경우
              console.log("완료 신호만 수신됨, 내용 없음");
            }

            // 누적 텍스트 초기화
            socketRef.current.accumulatedText = "";
            setIsLoading(false);
          }
          // 응답 메시지가 진행 중임을 표시 (type=message)
          else if (response.type === "message") {
            console.log("진행 중인 메시지:", response);
            // 이미 스트리밍 중인 메시지가 있으므로 추가 작업 필요 없음
          }
          // history 응답은 무시
          else if (response.type === "history") {
            console.log("History 응답 수신 (무시):", response.data ? response.data.length : 0, "개 항목");
            // history 데이터는 화면에 표시하지 않음
          }
          // 기타 응답 처리
          else {
            console.log("기타 응답 (인식되지 않은 응답 타입):", response);
            // 로딩 상태 유지하고 완료(complete) 응답을 기다림
          }
        } catch (err) {
          console.error("Response 파싱 오류:", err, "원본 데이터:", event.data);
          setMessages((prev) => [
            ...prev,
            {
              id: prev.length + 1,
              text: "데이터 처리 중 오류가 발생했습니다.",
              isUser: false,
            },
          ]);
          setIsLoading(false);
        }
      };

      socketRef.current.onerror = (error) => {
        console.error("❌ WebSocket 오류:", error);
        // WebSocket 오류의 더 자세한 정보 출력
        console.error("WebSocket 오류 상세:", {
          type: error.type,
          target: {
            url: error.target?.url,
            readyState: error.target?.readyState,
            bufferedAmount: error.target?.bufferedAmount,
            extensions: error.target?.extensions,
            protocol: error.target?.protocol,
          },
        });
        setIsLoading(false);
        setMessages((prev) => [...prev, { id: prev.length + 1, text: "웹소켓 오류 발생", isUser: false }]);
      };

      socketRef.current.onclose = (event) => {
        console.log("WebSocket 연결 종료:", {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          type: event.type,
        });

        // 일반적인 WebSocket 종료 코드 해석
        const closeCodeMessages = {
          1000: "정상 종료",
          1001: "엔드포인트가 종료됨 (예: 서버 종료, 페이지 이동)",
          1002: "프로토콜 오류로 인한 종료",
          1003: "지원되지 않는 데이터 타입으로 인한 종료",
          1005: "정상 종료, 코드 없음",
          1006: "비정상 종료 (연결 끊김)",
          1007: "메시지 타입 불일치로 인한 종료",
          1008: "정책 위반으로 인한 종료",
          1009: "메시지가 너무 큼",
          1010: "클라이언트에서 필요한 확장을 서버가 지원하지 않음",
          1011: "서버에서 예상치 못한 오류 발생",
          1012: "서버 재시작",
          1013: "임시적 문제로 인한 종료",
          1015: "TLS 핸드셰이크 실패",
        };

        console.log("WebSocket 종료 코드 의미:", closeCodeMessages[event.code] || "알 수 없는 종료 코드");

        // ping 인터벌 정리
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
      };
    } catch (err) {
      console.error("메시지 전송 오류:", err);
      console.error("오류 스택:", err.stack);
      setIsLoading(false);
    }
  };

  // 상품 목록 렌더링 함수
  const renderProductList = (products) => (
    <div className="product-list">
      {products.map((product) => (
        <div key={product.id} className="product-item">
          <div className="product-image">
            {product.image ? (
              <img src={product.image} alt={product.name} />
            ) : (
              <div className="no-image">이미지 없음</div>
            )}
          </div>
          <div className="product-info">
            <h3 className="product-name">{product.name}</h3>
            <p className="product-price">{product.price}</p>
            {product.link && (
              <a href={product.link} target="_blank" rel="noopener noreferrer" className="product-link">
                {product.link}
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="ai-chat-wrapper">
      <div className="chat-header">
        최적의 중고거래를 찾아드립니다!
        {!isLogged && (
          <div className="login-controls">
            <button onClick={() => setIsLogged(true)} className="login-button">
              로그인
            </button>
          </div>
        )}
      </div>

      <div className="chat-messages-container">
        <div className="chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`message ${msg.isUser ? "user-message" : "bot-message"}`}>
              {msg.isProductList ? (
                renderProductList(msg.products)
              ) : (
                <div
                  className={`message-text ${msg.isStreaming ? "streaming" : ""} ${msg.isProcessing ? "loading" : ""}`}
                >
                  {msg.text}
                </div>
              )}
              {msg.isUser && <div className="user-icon">👤</div>}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {!isLogged && (
          <div className="login-overlay">
            <div className="login-message">Login을 통해 대화하세요!</div>
          </div>
        )}
      </div>

      <ChatInput
        onSubmit={handleSend}
        inputText={inputText}
        onInputChange={setInputText}
        isDisabled={!isLogged || isLoading}
      />
    </div>
  );
};

export default Ai_Location;
