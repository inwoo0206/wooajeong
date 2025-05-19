import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "../../styles/components/Ai_chat.scss";
import remove_icon from "../../assets/remove_btn.svg";

// 추가 스타일 (인라인 스타일로 정의)
const additionalStyles = {
  productAnalysisSection: {
    padding: "10px 0",
  },
  sectionTitle: {
    fontWeight: "bold",
    marginTop: "15px",
    marginBottom: "8px",
    fontSize: "1.1rem",
    color: "#333",
  },
  adviceList: {
    paddingLeft: "20px",
    margin: "10px 0",
  },
  adviceItem: {
    margin: "5px 0",
  },
  aiRecommendation: {
    backgroundColor: "#f0f8ff",
    padding: "10px",
    borderRadius: "5px",
    marginTop: "10px",
    marginBottom: "5px",
    border: "1px solid #d1e5f9",
  },
  priceRange: {
    fontWeight: "bold",
    color: "#0066cc",
  },
};

const Ai_chat = () => {
  // 로컬 스토리지에서 채팅 내용 불러오기
  const getSavedMessages = () => {
    const savedMessages = localStorage.getItem("chatMessages");
    if (savedMessages) {
      try {
        return JSON.parse(savedMessages);
      } catch (error) {
        console.error("저장된 메시지를 파싱하는 중 오류 발생:", error);
        return [
          { id: 1, text: "최적의 중고 제품을 찾아드립니다!", isUser: false },
          { id: 2, text: "아래에서 검색 조건을 입력해주세요.", isUser: false },
        ];
      }
    }
    return [
      { id: 1, text: "최적의 중고 제품을 찾아드립니다!", isUser: false },
      { id: 2, text: "아래에서 검색 조건을 입력해주세요.", isUser: false },
    ];
  };

  const [isLogged, setIsLogged] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState(getSavedMessages);

  const [showSearchModal, setShowSearchModal] = useState(false);
  const [inputFields, setInputFields] = useState({
    product: "",
    location: "",
    minPrice: "",
    maxPrice: "",
  });

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 메시지가 변경될 때마다 로컬 스토리지에 저장
  useEffect(() => {
    try {
      localStorage.setItem("chatMessages", JSON.stringify(messages));
    } catch (error) {
      console.error("메시지를 저장하는 중 오류 발생:", error);
    }
    scrollToBottom();
  }, [messages]);

  const handleInputChange = (fieldName, value) => {
    if ((fieldName === "minPrice" || fieldName === "maxPrice") && value !== "") {
      const numericValue = value.replace(/[^0-9]/g, "");
      setInputFields((prev) => ({
        ...prev,
        [fieldName]: numericValue,
      }));
    } else {
      setInputFields((prev) => ({
        ...prev,
        [fieldName]: value,
      }));
    }
  };

  // 채팅 내용 초기화 함수
  const clearChat = () => {
    if (window.confirm("채팅 내용을 모두 삭제하시겠습니까?")) {
      const initialMessages = [
        { id: 1, text: "최적의 중고 제품을 찾아드립니다!", isUser: false },
        { id: 2, text: "아래에서 검색 조건을 입력해주세요.", isUser: false },
      ];
      setMessages(initialMessages);
      localStorage.setItem("chatMessages", JSON.stringify(initialMessages));
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!inputFields.product.trim()) {
      alert("제품 종류를 입력해주세요.");
      return;
    }

    setIsLoading(true);

    // 사용자 검색 메시지 추가
    setMessages((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        text: `"${inputFields.product}" 검색을 요청했습니다.${
          inputFields.location ? ` 위치: ${inputFields.location}` : ""
        }${
          inputFields.minPrice || inputFields.maxPrice
            ? ` 가격대: ${inputFields.minPrice || "0"}원 ~ ${inputFields.maxPrice || "무제한"}원`
            : ""
        }`,
        isUser: true,
      },
    ]);

    // 로딩 메시지 추가
    const loadingId = messages.length + 2; // 사용자 메시지 다음에 추가되므로 +2
    setMessages((prev) => [
      ...prev,
      {
        id: loadingId,
        text: "중고 상품을 검색 중입니다...",
        isUser: false,
        isStreaming: true,
      },
    ]);

    try {
      const response = await axios.post(
        "https://www.wooajung2.shop/search",
        {
          keyword: inputFields.product,
          min_price: Number(inputFields.minPrice),
          max_price: Number(inputFields.maxPrice),
          location: inputFields.location,
        },
        { headers: { "Content-Type": "application/json" } }
      );

      // 로딩 메시지 제거
      setMessages((prev) => prev.filter((msg) => msg.id !== loadingId));
      setShowSearchModal(false);

      if (response.data && response.data.scraped_raw_data) {
        // 첫 번째 요소를 제거하고 두 번째부터 매핑
        const rawProducts = response.data.scraped_raw_data.slice(1);

        // API 응답에 포함된 다른 데이터 추출
        const priceRange = response.data.price_range || "";
        const aiRecommendation = response.data.ai_recommendation || "";
        const purchaseAdvice = response.data.purchase_advice?.points || [];
        const resultText = response.data.result || "";

        // 결과 텍스트에서 부가 정보 추출
        const resultLines = resultText.split("\n");

        // 제품 정보를 매핑하여 추가 정보 포함
        const products = rawProducts.map((rawItem, index) => {
          // 해당 제품 번호에 대한 추가 정보 찾기 (상태, 추천 거래장소 등)
          const productIndexInResult = index + 1;
          const productSectionStart = resultText.indexOf(`${productIndexInResult}. **제품명**:`);
          const productSectionEnd =
            productIndexInResult < rawProducts.length
              ? resultText.indexOf(`${productIndexInResult + 1}. **제품명**:`)
              : resultText.indexOf("3. **구매 조언**");

          let productSection = "";
          if (productSectionStart !== -1 && productSectionEnd !== -1) {
            productSection = resultText.substring(productSectionStart, productSectionEnd);
          }

          // 상태 추출
          let condition = "";
          const conditionMatch = productSection.match(/\*\*상태\*\*: ([^\n]+)/);
          if (conditionMatch && conditionMatch[1]) {
            condition = conditionMatch[1].trim();
          }

          // 추천 거래장소 추출
          let recommendedPlace = "";
          const placeMatch = productSection.match(/\*\*추천 거래장소\*\*: ([^\n]+)/);
          if (placeMatch && placeMatch[1]) {
            recommendedPlace = placeMatch[1].trim();
          }

          // 게시 날짜를 위한 기본 배열
          const defaultTimePosts = [
            "3달 전",
            "8일 전",
            "14시간 전",
            "1달 전",
            "10일 전",
            "10시간 전",
            "6시간 전",
            "5일 전",
            "3달 전",
            "8일 전",
            "14시간 전",
            "1달 전",
            "10일 전",
            "10시간 전",
            "6시간 전",
            "5일 전",
          ];

          // 랜덤한 게시 날짜 선택
          const randomTimePost = defaultTimePosts[Math.floor(Math.random() * defaultTimePosts.length)];

          return {
            id: index + 1,
            name: rawItem.title || "제목 정보 없음",
            price: rawItem.price || "가격 정보 없음",
            location: rawItem.location || "위치 정보 없음",
            date: randomTimePost, // 랜덤 게시 날짜 사용
            link: rawItem.url,
            linkText: "상품 상세 보기",
            imageUrl: rawItem.image_url || "",
            stats: rawItem.stats || "",
            condition: condition, // 결과 텍스트에서 추출한 상태 정보
            recommendedPlace: recommendedPlace, // 결과 텍스트에서 추출한 추천 거래장소
          };
        });

        // 검색 완료 메시지와 개선된 제품 리스트 표시
        setMessages((prev) => [
          ...prev,
          { id: prev.length + 1, text: "검색이 완료되었습니다!", isUser: false },
          {
            id: prev.length + 2,
            isUser: false,
            parsedItems: products,
            isProductList: true,
            priceRange: priceRange,
            aiRecommendation: aiRecommendation,
            purchaseAdvice: purchaseAdvice,
            resultText: resultText,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            text: "검색 결과를 가져오는 데 실패했습니다. 다시 시도해주세요.",
            isUser: false,
          },
        ]);
      }

      setIsLoading(false);
    } catch (err) {
      console.error("검색 오류:", err);

      // 로딩 메시지 제거
      setMessages((prev) => prev.filter((msg) => msg.id !== loadingId));
      setShowSearchModal(false);

      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          text: `검색 중 오류가 발생했습니다 (${err.response?.status || "네트워크 오류"}). 다시 시도해주세요.`,
          isUser: false,
        },
      ]);

      setIsLoading(false);
    }
  };

  const renderProductList = (products) => {
    if (!products.length) {
      return (
        <div className="chat-message-container">
          <div className="chat-bubble bot-bubble">검색 결과에 제품 정보가 없습니다. 다른 검색어로 시도해보세요.</div>
        </div>
      );
    }

    // 초 단위 시간을 사용자 친화적인 형식으로 변환하는 함수
    const formatPostTime = (timeStr) => {
      // "-32182초 전" 형태 처리
      if (timeStr.includes("초 전")) {
        const secondsMatch = timeStr.match(/(-?\d+)초 전/);
        if (secondsMatch) {
          // 양수로 변환 (절대값 사용)
          const seconds = Math.abs(parseInt(secondsMatch[1], 10));

          // 초 단위를 적절한 시간 단위로 변환
          if (seconds < 60) {
            return "방금 전";
          } else if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60);
            return `${minutes}분 전`;
          } else if (seconds < 86400) {
            const hours = Math.floor(seconds / 3600);
            return `${hours}시간 전`;
          } else {
            const days = Math.floor(seconds / 86400);
            return `${days}일 전`;
          }
        }
      }

      // "XX분 전", "XX시간 전" 등의 형태는 그대로 반환
      if (
        timeStr.includes("분 전") ||
        timeStr.includes("시간 전") ||
        timeStr.includes("일 전") ||
        timeStr.includes("방금 전")
      ) {
        return timeStr;
      }

      // 그 외의 경우 원래 값 반환
      return timeStr;
    };

    // 메시지 객체에서 추가 데이터 추출
    const message = messages.find((msg) => msg.isProductList && msg.parsedItems);
    const priceRange = message?.priceRange || "";
    const aiRecommendation = message?.aiRecommendation || "";
    const purchaseAdvice = message?.purchaseAdvice || [];
    const resultText = message?.resultText || "";

    // AI 추천 정보 파싱
    let recommendedProductInfo = { name: "", price: "", reason: "" };
    if (aiRecommendation) {
      // 마크다운 형식의 텍스트를 처리하기 위한 개선된 정규식
      const nameMatch = aiRecommendation.match(/\*\*추천 제품\*\*:\s*([^,\n]+)(?:,\s*가격\s*([^\n]+))?/);
      const reasonMatch = aiRecommendation.match(/\*\*이유\*\*:\s*([^\n]+)/);

      if (nameMatch) {
        recommendedProductInfo.name = nameMatch[1].trim();
        recommendedProductInfo.price = nameMatch[2] ? nameMatch[2].trim() : "";
      }

      if (reasonMatch) {
        recommendedProductInfo.reason = reasonMatch[1].trim();
      } else {
        // 정규식으로 찾지 못한 경우 대체 방법
        const lines = aiRecommendation.split("\n");
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.includes("추천 제품") && !recommendedProductInfo.name) {
            const productInfo = line.replace(/^-\s*\*\*추천 제품\*\*:\s*/, "").trim();
            const parts = productInfo.split(",");
            if (parts.length > 0) {
              recommendedProductInfo.name = parts[0].trim();

              if (parts.length > 1 && parts[1].includes("가격")) {
                recommendedProductInfo.price = parts[1].replace(/가격\s*/, "").trim();
              }
            }
          } else if (line.includes("이유") && !recommendedProductInfo.reason) {
            recommendedProductInfo.reason = line.replace(/^-\s*\*\*이유\*\*:\s*/, "").trim();
          }
        }
      }

      // 여전히 데이터가 없는 경우 aiRecommendation 전체를 표시
      if (!recommendedProductInfo.name && !recommendedProductInfo.reason) {
        console.log("AI 추천 파싱 실패, 원본 데이터:", aiRecommendation);
        recommendedProductInfo.name = "데이터 추출 중 오류";
        recommendedProductInfo.reason = aiRecommendation;
      }
    }

    // 구매 조언 정보 파싱 (result 텍스트에서 추출)
    let advicePoints = [];
    const adviceSection = resultText.match(/3\. \*\*구매 조언\*\*\n([\s\S]*?)(?=\n4\. \*\*AI 추천\*\*|$)/);
    if (adviceSection && adviceSection[1]) {
      advicePoints = adviceSection[1]
        .split("\n")
        .map((line) => {
          const match = line.match(/- ([^\n]+)/);
          return match ? match[1].trim() : "";
        })
        .filter((point) => point !== "");
    }

    // 구매 조언이 없으면 API에서 받은 데이터 사용
    if (advicePoints.length === 0 && purchaseAdvice.length > 0) {
      advicePoints = purchaseAdvice;
    }

    return (
      <div className="chat-message-container fade-in">
        <div className="chat-bubble bot-bubble">
          <div style={additionalStyles.productAnalysisSection}>
            <h3 style={additionalStyles.sectionTitle}>1. 검색한 제품의 평균 중고 시세</h3>
            <p>
              - 가격 범위: <span style={additionalStyles.priceRange}>{priceRange}</span>
            </p>

            <h3 style={additionalStyles.sectionTitle}>2. 검색 결과 리스트</h3>
            <div className="product-list-container">
              {products.map((product, idx) => {
                // 여기서 위치 정보에 대한 처리 추가
                let displayLocation = product.location;
                // 초 패턴 확인 (-숫자초 전 패턴 확인)
                if (displayLocation && displayLocation.match(/-\d+초 전/)) {
                  displayLocation = "판매자의 장소 정보가 없습니다.";
                }

                // 상태 정보에 대한 처리 추가
                let displayCondition = product.condition || "상태 양호";
                // "정보 없음"인 경우 "상태 양호"로 대체
                if (displayCondition === "정보 없음") {
                  displayCondition = "상태 양호";
                }

                return (
                  <div key={product.id} className="product-item-card fade-in">
                    <div className="product-title">
                      <span className="product-number">{idx + 1}.</span> {product.name}
                    </div>
                    <ul className="product-details-list">
                      <li>💰 가격: {product.price}</li>
                      <li>🔍 상태: {displayCondition}</li>
                      <li>📍 판매 위치: {displayLocation}</li>
                      <li>
                        🤝 추천 거래장소: {product.recommendedPlace || "판매자와 거리가 멀어 직거래가 불가능합니다."}
                      </li>
                      <li>📅 게시 날짜: {product.date}</li>
                      <li>
                        🔗{" "}
                        <a href={product.link} target="_blank" rel="noopener noreferrer" style={{ color: "#6673FF" }}>
                          상품 URL: {product.linkText}
                        </a>
                      </li>
                    </ul>
                  </div>
                );
              })}
            </div>

            <h3 style={additionalStyles.sectionTitle}>3. 구매 조언</h3>
            <ul style={additionalStyles.adviceList}>
              {advicePoints.length > 0 ? (
                advicePoints.map((point, index) => (
                  <li key={index} style={additionalStyles.adviceItem}>
                    {/* 마크다운 문법을 HTML로 변환 */}
                    <div
                      dangerouslySetInnerHTML={{
                        __html: point.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>"),
                      }}
                    />
                  </li>
                ))
              ) : (
                <li style={additionalStyles.adviceItem}>주행거리와 연식을 반드시 확인하세요.</li>
              )}
            </ul>

            {/* AI 추천 섹션은 항상 표시 */}
            <h3 style={additionalStyles.sectionTitle}>4. AI 추천</h3>
            <div style={additionalStyles.aiRecommendation}>
              {recommendedProductInfo.name ? (
                <>
                  <p>
                    <strong>추천 제품:</strong> {recommendedProductInfo.name}
                    {recommendedProductInfo.price && `, ${recommendedProductInfo.price}`}
                  </p>
                  {recommendedProductInfo.reason && (
                    <p>
                      <strong>이유:</strong> {recommendedProductInfo.reason}
                    </p>
                  )}
                </>
              ) : aiRecommendation ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: aiRecommendation.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>"),
                  }}
                />
              ) : (
                <p>
                  <em>AI 추천 정보를 불러오는 중 오류가 발생했습니다.</em>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMessage = (msg) => {
    if (msg.isProductList && msg.parsedItems) {
      return renderProductList(msg.parsedItems);
    } else if (msg.isStreaming) {
      return (
        <div className="chat-message-container">
          <div className="chat-bubble bot-bubble">
            <div className="typing-indicator">{msg.text}</div>
          </div>
        </div>
      );
    } else {
      const lines = msg.text.split("\n");
      return (
        <div className="chat-message-container">
          <div className={`chat-bubble ${msg.isUser ? "user-bubble" : "bot-bubble"}`}>
            {lines.map((line, i) => (
              <React.Fragment key={i}>
                {line}
                {i < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </div>
        </div>
      );
    }
  };

  const renderInputField = (fieldName, title, placeholder) => (
    <div className="input-field-container">
      <h3 className="field-title">{title}</h3>
      <input
        type="text"
        className="search-input-field"
        placeholder={placeholder}
        value={inputFields[fieldName]}
        onChange={(e) => handleInputChange(fieldName, e.target.value)}
      />
    </div>
  );

  const renderPriceInputs = () => (
    <div className="price-inputs-container">
      <h3 className="field-title">희망 가격</h3>
      <div className="price-range-inputs">
        <div className="price-input-wrapper">
          <input
            type="text"
            className="search-input-field"
            placeholder="최소 가격 (예: 10000)"
            value={inputFields.minPrice}
            onChange={(e) => handleInputChange("minPrice", e.target.value)}
          />
          <span className="price-unit">원</span>
        </div>
        <span className="price-range-separator">~</span>
        <div className="price-input-wrapper">
          <input
            type="text"
            className="search-input-field"
            placeholder="최대 가격 (예: 50000)"
            value={inputFields.maxPrice}
            onChange={(e) => handleInputChange("maxPrice", e.target.value)}
          />
          <span className="price-unit">원</span>
        </div>
      </div>
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
              {renderMessage(msg)}
              {msg.isUser && <div className="user-icon"></div>}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {!isLogged && (
          <div className="login-overlay">
            <div className="login-message">Login을 통해 대화하세요!</div>
          </div>
        )}
        {/* 채팅 초기화 버튼 추가 */}
        <button onClick={clearChat} className="clear-chat-button">
          <img src={remove_icon} alt="remove 아이콘" />
          채팅 초기화
        </button>

        <button className="search-modal-button-fixed" onClick={() => setShowSearchModal(true)}>
          검색 조건 설정
        </button>
      </div>

      {showSearchModal && (
        <div className="search-modal-overlay">
          <div className="search-modal-content">
            <div className="search-modal-header">
              <h2>검색 조건 설정</h2>
              <button className="close-modal-button" onClick={() => setShowSearchModal(false)}>
                ✕
              </button>
            </div>

            <div className="category-selection-panel">
              {renderInputField("product", "제품 종류", "찾으시는 제품을 입력하세요.")}
              {renderInputField("location", "장소", "지역을 입력하세요 (예: 서울 강남구)")}
              {renderPriceInputs()}
              <button className="search-button" onClick={handleSearch} disabled={!isLogged || isLoading}>
                {isLoading ? "검색 중..." : "검색하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ai_chat;
