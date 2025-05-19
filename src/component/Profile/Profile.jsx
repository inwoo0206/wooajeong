import React, { useState, useEffect } from "react";
// import { useAuth } from "../../context/AuthContext";
import "../../styles/components/Profile.scss";
import logout_icon from "../../assets/logout.svg";
import trash_icon from "../../assets/trash.svg";

function Profile() {
  // const { user, logout } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [usdtBalance, setUsdtBalance] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [usdtAmount, setUsdtAmount] = useState(10);
  const [wonAmount, setWonAmount] = useState(13930);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // 알림 모달 관련 상태
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("success"); // "success" 또는 "error"

  const exchangeRate = 1393; // 1 USDT = 1,393원

  useEffect(() => {
    // 페이지 렌더링 시 사용자 정보와 USDT 잔액을 가져옵니다
    fetchUserData();
    fetchUsdtBalance();
  }, []);

  // 알림 모달 표시 함수
  const showMessage = (title, message, type = "success") => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setShowAlertModal(true);
  };

  // localStorage에서 access token을 가져오는 함수
  const getAuthToken = () => {
    // localStorage에서 accessToken 가져오기
    const token = localStorage.getItem("accessToken");

    // token이 없는 경우 처리
    if (!token) {
      console.error("Access token not found in localStorage");
      // 로그인 페이지로 리다이렉트하거나 다른 처리를 할 수 있습니다
      // window.location.href = '/login';
      return null;
    }

    return token;
  };

  // 사용자 정보를 가져오는 함수
  const fetchUserData = async () => {
    try {
      // 인증 토큰 가져오기
      const token = getAuthToken();

      // 토큰이 없으면 함수 종료
      if (!token) return;

      const response = await fetch("https://www.yunseo.store/api/user", {
        method: "GET",
        headers: {
          Authorization: `${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }

      const data = await response.json();

      // API에서 반환된 데이터로 상태 업데이트
      setName(data.nickname);
      setEmail(data.email);

      // localStorage에 사용자 정보 개별적으로 저장
      localStorage.setItem("user_id", data.user_id);
      localStorage.setItem("nickname", data.nickname);
      localStorage.setItem("email", data.email);
    } catch (error) {
      console.error("Error fetching user data:", error);
      // 오류 처리를 위한 상태 설정 (필요 시)
    }
  };

  const fetchUsdtBalance = async () => {
    setIsLoading(true);
    try {
      // 인증 토큰 가져오기
      const token = getAuthToken();

      // 토큰이 없으면 함수 종료
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await fetch("https://www.wooajung.shop/blockchain/coinBalance", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch balance");
      }
      const data = await response.json();
      setUsdtBalance(data.token);

      // 전역 이벤트 발생 - 다른 컴포넌트에게 잔액이 업데이트 되었음을 알림
      window.dispatchEvent(new CustomEvent("tokenBalanceUpdated", { detail: data.token }));
    } catch (error) {
      console.error("Error fetching USDT balance:", error);
      // You could set an error state here if needed
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    // Here you would typically update the user data via an API
    setIsEditing(false);
  };

  const handleLogout = () => {
    // localStorage에서 토큰 및 사용자 정보 제거
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user_id");
    localStorage.removeItem("nickname");
    localStorage.removeItem("email");
    // logout();
    // Redirect to login page would happen via Protected Routes
  };

  const handleUsdtChange = (e) => {
    const amount = parseFloat(e.target.value);
    setUsdtAmount(amount);
    setWonAmount(amount * exchangeRate);
  };

  const handleWonChange = (e) => {
    const amount = parseFloat(e.target.value);
    setWonAmount(amount);
    setUsdtAmount(Math.round((amount / exchangeRate) * 100) / 100);
  };

  const handleCharge = async () => {
    // 메시지 초기화
    setErrorMessage("");
    setSuccessMessage("");

    // 금액 유효성 검사
    if (!usdtAmount || usdtAmount <= 0) {
      setErrorMessage("유효한 USDT 금액을 입력해주세요.");
      return;
    }

    // 10,000 USDT 이상인 경우 알림 모달 표시
    if (usdtAmount >= 10000) {
      showMessage("충전 한도 초과", "10000 이하의 값만 충전 가능합니다.", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      // 인증 토큰 가져오기
      const token = getAuthToken();

      // 토큰이 없으면 함수 종료
      if (!token) {
        setErrorMessage("인증 정보가 없습니다. 다시 로그인해주세요.");
        setIsSubmitting(false);
        return;
      }

      // API 요청 본문 준비
      const payload = {
        token: parseFloat(usdtAmount),
      };

      // USDT를 달러로 변환하는 API 호출
      const response = await fetch("https://www.wooajung.shop/blockchain/coin_to_dollar", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to process payment");
      }

      // 응답 파싱 (필요한 경우)
      const result = await response.json();
      console.log("결제가 성공적으로 처리되었습니다:", result);

      // 성공 메시지 설정
      setSuccessMessage(`${usdtAmount} USDT 충전이 완료되었습니다.`);

      // 짧은 지연 후 모달 닫기 및 잔액 업데이트
      setTimeout(() => {
        setShowModal(false);
        // 성공적인 결제 후 잔액 새로고침
        fetchUsdtBalance();
      }, 1500);
    } catch (error) {
      console.error("결제 처리 중 오류:", error);
      // 결제 오류 처리
      setErrorMessage("결제 처리 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 알림 모달 닫기
  const closeAlertModal = () => {
    setShowAlertModal(false);
  };

  return (
    <div className="profile-container">
      <div className="profile-header">AI로 안전하고 스마트한 중고거래 경험을 만나보세요!</div>
      <div className="profile-card">
        <div className="profile-form">
          <div className="form-group">
            <label htmlFor="name">이름</label>
            <div className="input-with-button">
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">이메일</label>
            <div className="input-with-button">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="usdt">보유 중인 USDT</label>
            <div className="usdt-container">
              <input
                type="text"
                id="usdt"
                value={isLoading ? "로딩 중..." : `${usdtBalance} USDT`}
                disabled
                className="usdt-input"
              />
              <button className="charge-button" onClick={() => setShowModal(true)} disabled={isLoading}>
                USDT 충전하기
              </button>
            </div>
          </div>

          <div className="logout-container">
            <button className="logout-button" onClick={handleLogout}>
              <img src={logout_icon} alt="logout 아이콘" />
              로그아웃
            </button>
            <button className="logout-button" onClick={handleLogout}>
              <img src={trash_icon} alt="trash 아이콘" />
              회원탈퇴
            </button>
          </div>
        </div>
      </div>

      {/* USDT 충전 모달 */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                <span className="plus-icon">+</span> USDT 충전하기
              </h3>
              <button className="close-button" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <p className="exchange-rate-info">
                <span className="currency-icon">$</span> 1 USDT = {exchangeRate}원 의 비율로 측정됩니다.
              </p>
              <p className="calculation-info">환산된 금액에 대한 결과는 다음과 같습니다.</p>

              {errorMessage && <p className="error-message">{errorMessage}</p>}
              {successMessage && <p className="success-message">{successMessage}</p>}

              <div className="currency-converter">
                <div className="currency-input">
                  <span className="currency-symbol">$</span>
                  <input
                    type="number"
                    value={usdtAmount}
                    onChange={handleUsdtChange}
                    className="usdt-amount-input"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="converter-arrow">⇄</div>

                <div className="currency-input">
                  <input
                    type="number"
                    value={wonAmount}
                    onChange={handleWonChange}
                    className="won-amount-input"
                    disabled={isSubmitting}
                  />
                  <span className="currency-label">₩</span>
                </div>
              </div>

              <button className="payment-button" onClick={handleCharge} disabled={isSubmitting}>
                {isSubmitting ? "처리 중..." : "결제 하기"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 알림 모달 (성공/오류) */}
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
              borderRadius: "10px",
              padding: "24px",
              width: "400px",
              maxWidth: "90%",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              position: "relative",
            }}
          >
            <button
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "none",
                border: "none",
                fontSize: "24px",
                cursor: "pointer",
                padding: 0,
              }}
              onClick={closeAlertModal}
            >
              ×
            </button>
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <h2
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  marginBottom: "12px",
                  color: modalType === "error" ? "#ff6b6b" : "#333",
                }}
              >
                {modalTitle}
              </h2>
              <p style={{ fontSize: "14px", color: "#666", marginBottom: "24px" }}>{modalMessage}</p>
              <button
                style={{
                  backgroundColor: modalType === "error" ? "#ff6b6b" : "#6c7aee",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  padding: "12px",
                  width: "100%",
                  fontSize: "16px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
                onClick={closeAlertModal}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
