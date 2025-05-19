import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../styles/components/DealList.scss";
import "../../styles/components/Ai_chat.scss";
import shopbag_icon from "../../assets/shopbag.svg";

const DealList = () => {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 모달 상태 관리
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("success"); // "success" 또는 "error"

  // 고정된 토큰 사용
  const getAuthToken = () => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      console.error("Access token not found in localStorage");
      return null;
    }

    return token;
  };

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const token = getAuthToken();
        const response = await axios.get("https://www.wooajung.shop/blockchain/check_escrow", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // "created" 상태인 거래만 필터링
        const activeDeals = response.data.data.filter((deal) => deal.status === "created");
        setDeals(activeDeals);
        setLoading(false);
      } catch (err) {
        setError("거래 목록을 불러오는데 실패했습니다.");
        setLoading(false);
        console.error("거래 목록 불러오기 오류:", err);
      }
    };

    fetchDeals();
  }, []);

  // 토큰 잔액 조회 함수
  const fetchTokenBalance = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await axios.get("https://www.wooajung.shop/blockchain/coinBalance", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 200) {
        // 토큰 잔액 업데이트 이벤트 발생
        window.dispatchEvent(new CustomEvent("tokenBalanceUpdated", { detail: response.data.token }));
      }
    } catch (error) {
      console.error("Error fetching token balance:", error);
    }
  };

  // 모달을 표시하는 함수
  const showMessageModal = (title, message, type = "success") => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setShowModal(true);
  };

  // 구매 확정 및 출금하기 공통 함수
  const handleWithdraw = async (id) => {
    try {
      const token = getAuthToken();
      await axios.post(
        "https://www.wooajung.shop/blockchain/withdraw",
        {
          escrowId: id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // 성공 시 목록 다시 불러오기
      const response = await axios.get("https://www.wooajung.shop/blockchain/check_escrow", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const activeDeals = response.data.data.filter((deal) => deal.status === "created");
      setDeals(activeDeals);

      // 토큰 잔액 업데이트
      fetchTokenBalance();

      // 성공 모달 표시
      showMessageModal("성공", "성공적으로 처리되었습니다.", "success");
    } catch (err) {
      console.error("출금 처리 오류:", err);

      // 오류 응답에서 메시지 추출
      let errorMessage = "출금 처리에 실패했습니다.";
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      }

      // 오류 모달 표시
      showMessageModal("오류 발생", errorMessage, "error");
    }
  };

  // 거래 취소 처리 함수
  const handleCancelTransaction = async (id) => {
    try {
      const token = getAuthToken();
      await axios.post(
        "https://www.wooajung.shop/blockchain/delete_escrow",
        {
          escrowId: id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // 성공 시 목록 다시 불러오기
      const response = await axios.get("https://www.wooajung.shop/blockchain/check_escrow", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const activeDeals = response.data.data.filter((deal) => deal.status === "created");
      setDeals(activeDeals);

      // 토큰 잔액 업데이트
      fetchTokenBalance();

      // 성공 모달 표시
      showMessageModal("거래 중단 요청이 완료되었습니다.", "중단 요청 시, 상대방의 동의 또한 필요합니다.", "success");
    } catch (err) {
      console.error("거래 취소 오류:", err);

      // 오류 응답에서 메시지 추출
      let errorMessage = "거래 취소에 실패했습니다.";
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      }

      // 오류 모달 표시
      showMessageModal("오류 발생", errorMessage, "error");
    }
  };

  if (loading) {
    return (
      <div className="deal-list-main-container">
        <div className="deal-list-title">진행 중인 거래들을 확인 해보세요!</div>
        <div className="deal-list-container">
          <div className="loading-message">거래 목록을 불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="deal-list-main-container">
        <div className="deal-list-title">진행 중인 거래들을 확인 해보세요!</div>
        <div className="deal-list-container">
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="deal-list-main-container">
      <div className="deal-list-title">진행 중인 거래들을 확인 해보세요!</div>
      <div className="deal-list-container">
        {deals.length === 0 ? (
          <div className="loading-message">진행 중인 거래가 없습니다.</div>
        ) : (
          deals.map((deal) => (
            <div key={deal.id} className="deal-item">
              <div className="deal-icon-container">
                <img src={shopbag_icon} alt="쇼핑백 아이콘" width="36" height="36" />
              </div>
              <div className="deal-info">
                <div className="product-name">{deal.product}</div>
                <div className="deal-details">
                  구매자: {deal.buyer} 판매자: {deal.seller} 가격: {deal.token} USTD
                </div>
              </div>
              <div className="deal-buttons">
                <button className="confirm-button" onClick={() => handleWithdraw(deal.id)}>
                  {deal.role === "buyer" ? "구매 확정" : "출금하기"}
                </button>
                <button className="cancel-button" onClick={() => handleCancelTransaction(deal.id)}>
                  거래 취소
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 메시지 모달 (성공/에러) */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-container">
            <button className="modal-close-button" onClick={() => setShowModal(false)}>
              ×
            </button>
            <div className="modal-content">
              <h2 className="modal-title" style={{ color: modalType === "error" ? "#ff6b6b" : "#333" }}>
                {modalTitle}
              </h2>
              <p className="modal-message">{modalMessage}</p>
              <button
                className="modal-confirm-button"
                style={{
                  backgroundColor: modalType === "error" ? "#ff6b6b" : "#6c7aee",
                }}
                onClick={() => setShowModal(false)}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DealList;
