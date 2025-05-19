import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/components/ChatList.scss";
import "../../styles/components/Ai_chat.scss";

const AddProductList = () => {
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [inputFields, setInputFields] = useState({
    product: "",
    location: "",
    minPrice: "",
    maxPrice: "",
  });
  const [interests, setInterests] = useState([]);

  // localStorage에서 user_id 가져오는 함수 - 정수형으로 변환
  const getUserId = () => {
    const userIdStr = localStorage.getItem("user_id");
    if (!userIdStr) {
      console.error("user_id not found in localStorage");
      return null;
    }
    // 문자열을 정수로 변환
    const userId = parseInt(userIdStr, 10);
    // 변환 결과가 유효한 숫자인지 확인
    if (isNaN(userId)) {
      console.error("Invalid user_id in localStorage:", userIdStr);
      return null;
    }
    return userId;
  };

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

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!inputFields.product.trim()) {
      alert("제품 종류를 입력해주세요.");
      return;
    }

    const userId = getUserId();
    if (!userId) {
      alert("사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.");
      return;
    }

    try {
      // API 호출을 위한 데이터 구성
      const requestData = {
        user_id: userId, // localStorage에서 가져온 정수형 user_id 사용
        keyword: inputFields.product,
        location: inputFields.location,
        min_price: parseInt(inputFields.minPrice, 10) || 0, // 정수형으로 변환
        max_price: parseInt(inputFields.maxPrice, 10) || 0, // 정수형으로 변환
      };

      console.log("API 요청 데이터:", requestData);

      // API 호출
      const response = await fetch("https://www.yunseo.store/searches/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      // 응답 처리를 개선: 먼저 응답이 성공적인지 확인
      if (response.ok) {
        try {
          // 응답이 JSON인 경우에만 파싱 시도
          const contentType = response.headers.get("content-type");
          let responseData;

          if (contentType && contentType.includes("application/json")) {
            responseData = await response.json();
            console.log("API 응답:", responseData);
          } else {
            // JSON이 아닌 경우 텍스트로 읽음
            const textResponse = await response.text();
            console.log("API 응답 (텍스트):", textResponse);
          }

          // 성공적으로 저장되면 목록을 다시 가져옵니다
          fetchInterests();

          // 입력 필드 초기화
          setInputFields({
            product: "",
            location: "",
            minPrice: "",
            maxPrice: "",
          });

          setShowSearchModal(false);
        } catch (parseError) {
          console.error("응답 파싱 중 오류:", parseError);
          // JSON 파싱 오류가 발생해도 작업은 성공했을 수 있으므로 계속 진행
          fetchInterests();
          setInputFields({
            product: "",
            location: "",
            minPrice: "",
            maxPrice: "",
          });
          setShowSearchModal(false);
        }
      } else {
        alert(`관심사 저장 중 오류가 발생했습니다. (상태 코드: ${response.status})`);
      }
    } catch (error) {
      console.error("API 호출 중 오류:", error);
      alert("관심사 저장 중 오류가 발생했습니다.");
    }
  };

  useEffect(() => {
    // 컴포넌트가 마운트될 때 관심사 목록을 가져옵니다
    fetchInterests();
  }, []);

  const fetchInterests = async () => {
    try {
      const userId = getUserId();
      if (!userId) {
        console.error("사용자 정보를 찾을 수 없습니다.");
        return;
      }

      // user_id를 정수형으로 쿼리 파라미터에 추가
      const response = await fetch(`https://www.yunseo.store/searches/list?user_id=${userId}`);

      if (!response.ok) {
        console.error("관심사 목록 가져오기 실패:", response.status);
        return;
      }

      try {
        const data = await response.json();
        console.log("API 응답 (목록):", data);

        // API 응답 데이터를 컴포넌트에서 사용하는 형식으로 변환
        const formattedInterests = data.map((item) => {
          console.log("처리 중인 항목:", item); // 개별 항목 로깅

          // 두 가지 가능한 키 이름을 모두 확인 (minPrice와 min_price)
          const minPriceValue =
            item.minPrice !== undefined ? item.minPrice : item.min_price !== undefined ? item.min_price : 0;

          const maxPriceValue =
            item.maxPrice !== undefined ? item.maxPrice : item.max_price !== undefined ? item.max_price : 0;

          return {
            id: item.id,
            product: item.keyword,
            location: item.location || "",
            minPrice: String(minPriceValue),
            maxPrice: String(maxPriceValue),
          };
        });

        console.log("포맷된 관심사 목록:", formattedInterests);
        setInterests(formattedInterests);
      } catch (parseError) {
        console.error("목록 응답 파싱 중 오류:", parseError);
      }
    } catch (error) {
      console.error("관심사 목록 가져오기 오류:", error);
    }
  };

  const handleInterestClick = (interest) => {
    // 관심사 클릭 시 처리 로직
    console.log("선택된 관심사:", interest);
    // 여기에 중고 상품 검색 페이지로 이동하는 로직 등을 추가할 수 있습니다
  };

  const handleDeleteInterest = async (id) => {
    console.log("삭제할 관심사 ID:", id);

    try {
      // 삭제 API 호출 - 쿼리 파라미터로 id 전달
      const response = await fetch(`https://www.yunseo.store/searches/delete?id=${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("삭제 API 응답 상태:", response.status);

      if (response.ok) {
        // API 호출이 성공하면 UI에서도 해당 항목 제거
        const updatedInterests = interests.filter((interest) => interest.id !== id);
        setInterests(updatedInterests);
        console.log("관심사가 성공적으로 삭제되었습니다.");
      } else {
        // 응답 데이터 확인 (JSON이 아닐 수 있으므로 예외 처리)
        try {
          const responseData = await response.json();
          console.log("삭제 API 응답:", responseData);
        } catch (e) {
          console.log("응답을 JSON으로 파싱할 수 없습니다.");
        }

        alert("관심사 삭제 중 오류가 발생했습니다. (상태 코드: " + response.status + ")");
      }
    } catch (error) {
      console.error("관심사 삭제 API 호출 중 오류:", error);
      alert("관심사 삭제 중 오류가 발생했습니다.");
    }
  };

  const formatPrice = (price) => {
    // 문자열 또는 숫자를 처리할 수 있도록 함
    if (price === undefined || price === null || price === "") {
      return "0원";
    }

    // 문자열이든 숫자든 parseInt로 처리
    const numPrice = parseInt(price, 10);
    if (isNaN(numPrice)) {
      return "0원";
    }
    return numPrice.toLocaleString() + "원";
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
    <div className="chat-list-main-container">
      <div className="chat-list-title">관심사를 등록 해보세요!</div>
      <div className="chat-list-container">
        {interests.map((interest) => (
          <div key={interest.id} className="chat-room-item interest-card" onClick={() => handleInterestClick(interest)}>
            <div className="chat-room-left">
              <div className="interest-icon">🔍</div>
              <div className="chat-room-info">
                <div className="chat-room-title product-title">{interest.product}</div>
                <div className="interest-details">
                  <span className="interest-location">
                    <i className="location-icon">📍</i> {interest.location || "지역 미지정"}
                  </span>
                  <span className="interest-price">
                    <i className="price-icon">💰</i> {formatPrice(interest.minPrice)} ~ {formatPrice(interest.maxPrice)}
                  </span>
                </div>
              </div>
            </div>
            <div className="interest-actions">
              <button
                className="interest-button search-now-button"
                onClick={(e) => {
                  e.stopPropagation(); // 버블링 방지
                  handleDeleteInterest(interest.id);
                }}
              >
                관심사 삭제
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 검색 조건 설정 버튼 */}
      <button className="search-modal-button-fixed" onClick={() => setShowSearchModal(true)}>
        관심사 추가하기
      </button>

      {/* 검색 모달 */}
      {showSearchModal && (
        <div className="search-modal-overlay">
          <div className="search-modal-content">
            <div className="search-modal-header">
              <h2>관심사 추가하기</h2>
              <button className="close-modal-button" onClick={() => setShowSearchModal(false)}>
                ✕
              </button>
            </div>

            <div className="category-selection-panel">
              {renderInputField("product", "제품 종류", "찾으시는 제품을 입력하세요.")}
              {renderInputField("location", "장소", "지역을 입력하세요 (예: 서울 강남구)")}
              {renderPriceInputs()}
              <button className="search-button" onClick={handleSearch}>
                추가하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddProductList;
