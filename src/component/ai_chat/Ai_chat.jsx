import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "../../styles/components/Ai_chat.scss";
import remove_icon from "../../assets/remove_btn.svg";

const Ai_chat = () => {
  const randomTimeArray = [
    "2시간 전",
    "3시간 전",
    "5시간 전",
    "6시간 전",
    "8시간 전",
    "12시간 전",
    "14시간 전",
    "16시간 전",
    "18시간 전",
    "22시간 전",
    "1일 전",
    "2일 전",
    "3일 전",
    "4일 전",
    "5일 전",
    "7일 전",
    "8일 전",
    "9일 전",
    "10일 전",
    "11일 전",
    "12일 전",
    "15일 전",
    "20일 전",
    "1주일 전",
    "2주일 전",
  ];

  // 기본 구매 조언 배열 추가
  const defaultAdviceArray = [
    "거래는 공공장소에서 하시고, 현금보다는 계좌 이체를 이용하세요.",
    "제품 상태를 직접 확인한 후 구매를 결정하세요.",
    "판매자와 충분한 대화를 나눈 후 신뢰도를 판단하세요.",
    "가격이 너무 저렴하다면 의심해보고 신중하게 결정하세요.",
    "거래 전 해당 제품의 시세를 미리 조사해보세요.",
    "중요한 거래는 지인과 함께 하거나 주변에 알려두세요.",
    "온라인 결제보다는 직거래를 통한 현장 확인을 권장합니다.",
    "판매자의 다른 판매 내역과 평점을 확인해보세요.",
    "제품 보증서나 구매 영수증이 있는지 확인하세요.",
    "배송 거래 시에는 안전결제 서비스를 이용하세요.",
    "직거래 시 혼잡한 장소보다는 CCTV가 설치된 장소를 선택하세요.",
    "거래 내용을 문자나 채팅으로 남겨 두면 분쟁 발생 시 도움이 됩니다.",
    "제품 사진과 실물을 비교하여 차이가 있는지 확인하세요.",
    "고가의 제품일수록 사기 사례가 많으니 더욱 신중하게 거래하세요.",
    "중복 게시물이 있는 경우 사기 가능성을 의심해보세요.",
    "구매 전 판매자의 연락처가 정상적으로 작동하는지 확인하세요.",
    "급하게 거래를 유도하는 경우 사기를 의심해보는 것이 좋습니다.",
    "제품의 모델명과 제조년도를 정확히 확인하세요.",
    "제품의 사용 흔적이나 기능 이상 여부를 꼼꼼히 확인하세요.",
    "거래가 끝난 후에도 일정 기간 보관 가능한 기록을 남겨두세요.",
    "거래 전에 상대방의 신분을 확인할 수 있는 방법을 확보해두세요.",
    "시간 약속을 자주 변경하는 판매자는 주의가 필요합니다.",
    "거래 직전에 가격을 바꾸는 경우 의심해볼 필요가 있습니다.",
    "안전거래를 유도하는 링크는 피싱일 가능성이 있으니 주의하세요.",
    "직거래 시 제품을 직접 테스트해보는 것이 가장 안전합니다.",
    "무통장 입금을 유도하는 판매자는 신뢰할 수 없는 경우가 많습니다.",
    "너무 급하게 판매하는 경우 제품 하자 여부를 반드시 확인하세요.",
    "사진만으로 판단하지 말고 영상이나 추가 사진을 요청해보세요.",
    "가능하다면 전화 통화를 통해 판매자의 진위 여부를 확인하세요.",
    "거래 전에 약속한 조건(가격, 상태 등)을 다시 한 번 확인하세요.",
  ];

  // 랜덤으로 3-4개의 조언을 선택하는 함수
  const getRandomAdvice = () => {
    const shuffled = [...defaultAdviceArray].sort(() => 0.5 - Math.random());
    const count = Math.floor(Math.random() * 2) + 3; // 3~4개 랜덤 선택
    return shuffled.slice(0, count);
  };

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
    const loadingId = messages.length + 2;
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

        // result 텍스트에서 제품별 상세 정보 파싱
        const parseProductDetails = (resultText) => {
          const productSections = [];
          const sections = resultText.split(/\d+\.\s\*\*제품명\*\*:/);

          for (let i = 1; i < sections.length; i++) {
            const section = sections[i];

            // 제품명 추출
            const nameMatch = section.match(/^([^\n]+)/);
            const name = nameMatch ? nameMatch[1].trim() : "";

            // 가격 추출
            const priceMatch = section.match(/\*\*가격\*\*:\s*([^\n]+)/);
            const price = priceMatch ? priceMatch[1].trim() : "";

            // 상태 추출
            const stateMatch = section.match(/\*\*상태\*\*:\s*([^\n]+)/);
            const state = stateMatch ? stateMatch[1].trim() : "";

            // 판매 위치 추출
            const locationMatch = section.match(/\*\*판매 위치\*\*:\s*([^\n]+)/);
            const location = locationMatch ? locationMatch[1].trim() : "";

            // 추천 거래장소 추출
            const placeMatch = section.match(/\*\*추천 거래장소\*\*:\s*([^\n]+)/);
            const recommendedPlace = placeMatch ? placeMatch[1].trim() : "";

            // 출처 추출
            const sourceMatch = section.match(/\*\*출처\*\*:\s*([^\n]+)/);
            const source = sourceMatch ? sourceMatch[1].trim() : "";

            // URL 추출
            const urlMatch = section.match(/\*\*상품 URL\*\*:\s*\[링크\]\(([^)]+)\)/);
            const url = urlMatch ? urlMatch[1].trim() : "";

            productSections.push({
              name,
              price,
              state,
              location,
              recommendedPlace,
              source,
              url,
            });
          }

          return productSections;
        };

        const productDetails = parseProductDetails(resultText);

        const getRandomTime = () => {
          const randomIndex = Math.floor(Math.random() * randomTimeArray.length);
          return randomTimeArray[randomIndex];
        };

        // 제품 정보를 매핑하여 추가 정보 포함
        const products = rawProducts.map((rawItem, index) => {
          const detail = productDetails[index] || {};

          return {
            id: index + 1,
            name: detail.name || rawItem.title || "제목 정보 없음",
            price: detail.price || rawItem.price || "가격 정보 없음",
            location: detail.location || rawItem.location || "위치 정보 없음",
            date: getRandomTime(),
            link: detail.url || rawItem.url,
            linkText: "상품 상세 보기",
            imageUrl: rawItem.image_url || "",
            stats: rawItem.stats || "",
            condition: detail.state || "상태 양호",
            recommendedPlace: detail.recommendedPlace || "판매자와 협의 필요",
            source: detail.source || rawItem.source || "정보 없음", // source 필드 수정
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

  // 새 스타일로 제품 리스트 렌더링
  const renderProductList = (products) => {
    if (!products.length) {
      return (
        <div className="chat-message-container">
          <div className="bot-bubble">검색 결과에 제품 정보가 없습니다. 다른 검색어로 시도해보세요.</div>
        </div>
      );
    }

    // 메시지 객체에서 추가 데이터 추출
    const message = messages.find((msg) => msg.isProductList && msg.parsedItems);
    const priceRange = message?.priceRange || "";
    const aiRecommendation = message?.aiRecommendation || "";
    const purchaseAdvice = message?.purchaseAdvice || [];

    // AI 추천 정보 파싱
    let recommendedProductInfo = {
      name: "",
      reason: "",
    };

    if (aiRecommendation) {
      const nameMatch = aiRecommendation.match(/\*\*추천 제품\*\*:\s*([^\n]+)/);
      const reasonMatch = aiRecommendation.match(/\*\*이유\*\*:\s*([^\n]+)/);

      if (nameMatch) {
        recommendedProductInfo.name = nameMatch[1].trim();
      }

      if (reasonMatch) {
        recommendedProductInfo.reason = reasonMatch[1].trim();
      }
    }

    // 추천 제품 찾기 - AI 추천과 일치하는 제품 찾기
    const recommendedProduct =
      products.find((product) => {
        const productName = product.name.toLowerCase();
        const recommendedName = recommendedProductInfo.name.toLowerCase();
        return productName.includes(recommendedName) || recommendedName.includes(productName);
      }) || products[0];

    // 추천 제품을 맨 앞으로 이동한 새로운 배열 생성
    const sortedProducts = [...products];
    if (recommendedProduct) {
      // 추천 제품을 배열에서 제거
      const recommendedIndex = sortedProducts.findIndex((p) => p.id === recommendedProduct.id);
      if (recommendedIndex > -1) {
        sortedProducts.splice(recommendedIndex, 1);
      }
      // 추천 제품을 맨 앞에 추가
      sortedProducts.unshift(recommendedProduct);
    }

    // 평균 시세를 계산하는 함수 추가
    const calculateAveragePrice = (priceRangeText) => {
      if (!priceRangeText) return "정보 없음";

      // 숫자와 원을 포함한 패턴을 찾기 (예: "10,000원", "50000원" 등)
      const priceMatches = priceRangeText.match(/(\d{1,3}(?:,\d{3})*|\d+)(?:원)?/g);

      if (!priceMatches || priceMatches.length < 2) {
        return priceRangeText; // 원본 텍스트 반환
      }

      // 처음 두 개의 가격 값 추출하고 쉼표 제거 후 숫자로 변환
      const price1 = parseInt(priceMatches[0].replace(/[,원]/g, ""));
      const price2 = parseInt(priceMatches[1].replace(/[,원]/g, ""));

      // 평균 계산
      const average = Math.round((price1 + price2) / 2);

      // 천 단위 구분자 추가
      const formattedAverage = average.toLocaleString("ko-KR");

      return `해당 제품의 평균시세는 ${formattedAverage}원으로 측정됩니다.`;
    };

    return (
      <div className="chat-message-container">
        <div className="bot-bubble">
          <div className="product-results">
            {/* 시세 정보 */}
            <div className="price-info-section">
              <h3 className="section-title">💰 평균 시세</h3>
              <p className="price-range-text">{calculateAveragePrice(priceRange)}</p>
            </div>

            {/* 상품 리스트 제목 */}
            <h3 className="section-title">📋 상품 리스트</h3>

            {/* 상품 리스트 - 가로 스크롤 카드 (추천 제품이 맨 앞에) */}
            <div className="product-cards-container">
              <div className="product-cards-scroll">
                {sortedProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className={`product-card-horizontal ${product.id === recommendedProduct.id ? "recommended" : ""}`}
                  >
                    <div className="product-image-container">
                      <img
                        src={product.imageUrl || "https://via.placeholder.com/200x150?text=이미지+없음"}
                        alt={product.name}
                        className="product-image-horizontal"
                      />
                      {product.id === recommendedProduct.id && <div className="recommended-badge">AI 추천</div>}
                      {index === 0 && product.id === recommendedProduct.id && (
                        <div className="first-recommended-badge">1순위</div>
                      )}
                      <div
                        className={`source-badge ${
                          product.source === "중고나라"
                            ? "junggo"
                            : product.source === "번개장터"
                            ? "bungae"
                            : "default"
                        }`}
                      >
                        {product.source}
                      </div>
                    </div>
                    <div className="product-info-horizontal">
                      <h4 className="product-name-horizontal">{product.name}</h4>
                      <div className="product-details-horizontal">
                        <p>
                          <span className="detail-label">가격:</span> {product.price}
                        </p>
                        <p>
                          <span className="detail-label">상태:</span>{" "}
                          {product.condition === "정보 없음" || !product.condition || product.condition.trim() === ""
                            ? "양호"
                            : product.condition}
                        </p>
                        <p>
                          <span className="detail-label">위치:</span> {product.location}
                        </p>
                        <p>
                          <span className="detail-label">게시:</span> {product.date}
                        </p>
                        <p>
                          <span className="detail-label">거래장소:</span> {product.recommendedPlace}
                        </p>
                      </div>
                      <a href={product.link} target="_blank" rel="noopener noreferrer" className="product-link-button">
                        상품 보러가기
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI 추천 섹션 */}
            <div className="ai-recommendation-section">
              <h3 className="section-title">🤖 AI 추천</h3>
              <div className="ai-recommendation-card">
                <div className="recommendation-content">
                  <h4 className="recommended-product-name">{recommendedProductInfo.name || "추천 제품"}</h4>
                  <p className="recommendation-reason">
                    {recommendedProductInfo.reason || "최적의 가성비와 품질을 고려한 추천입니다."}
                  </p>
                </div>
              </div>
            </div>

            {/* 구매 조언 */}
            <div className="advice-container">
              <h4 className="advice-title">💡 구매 조언</h4>
              <ul className="advice-list">
                {purchaseAdvice.length > 0
                  ? // API에서 받은 조언이 있으면 그것을 사용하되, 랜덤 조언도 추가
                    [
                      ...purchaseAdvice.map((point, idx) => (
                        <li key={`api-${idx}`}>
                          {point
                            .replace(/\*\*([^*]+)\*\*/g, "$1") // **텍스트** → 텍스트
                            .replace(/주의사항 \d+:\s*/g, "") // "주의사항 1: " 제거
                            .trim()}
                        </li>
                      )),
                      // 기본 조언 중 랜덤으로 선택하여 추가
                      ...getRandomAdvice()
                        .slice(0, 4 - purchaseAdvice.length)
                        .map((advice, idx) => <li key={`default-${idx}`}>{advice}</li>),
                    ]
                  : // API 조언이 없으면 랜덤 조언만 표시
                    getRandomAdvice().map((advice, idx) => <li key={`random-${idx}`}>{advice}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 기본 메시지 렌더링
  const renderMessage = (msg) => {
    if (msg.isProductList && msg.parsedItems) {
      return renderProductList(msg.parsedItems);
    } else if (msg.isStreaming) {
      return (
        <div className="chat-message-container">
          <div className="bot-bubble">
            <div className="typing-indicator">{msg.text}</div>
          </div>
        </div>
      );
    } else {
      const lines = msg.text.split("\n");
      return (
        <div className="chat-message-container">
          <div className={`${msg.isUser ? "user-bubble" : "bot-bubble"}`}>
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
      <div className="chat-container">
        <div className="chat-messages-wrap">
          <div className="chat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.isUser ? "user-message" : "bot-message"}`}>
                {renderMessage(msg)}
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

        {/* 검색 버튼 */}
        <button className="search-modal-button" onClick={() => setShowSearchModal(true)}>
          검색 조건 설정
        </button>

        {/* 채팅 초기화 버튼 */}
        <button onClick={clearChat} className="clear-chat-button">
          <img src={remove_icon} alt="remove 아이콘" />
          채팅 초기화
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
