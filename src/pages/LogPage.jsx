import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/pages/LogPage.scss";
import MetaMaskLogin from "../component/Auth/MetamaskLogin";

/**
 * MetaMask 로그인 전용 페이지 컴포넌트
 */
function LogPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [userAccount, setUserAccount] = useState("");

  // 페이지 로드 시 로그인 상태 확인
  useEffect(() => {
    const wallet = localStorage.getItem("wallet");
    if (wallet) {
      setUserAccount(wallet);
      setLoginSuccess(true);
    }
  }, []);

  // MetaMask 로그인 성공 처리
  const handleMetaMaskLoginSuccess = (account, signature) => {
    console.log("MetaMask 로그인 성공:", account);
    console.log("서명:", signature);

    setUserAccount(account);
    setLoginSuccess(true);

    // 로그인 성공 후 홈페이지로 이동
    setTimeout(() => {
      navigate("/home");
    }, 2000);
  };

  // 로그아웃 처리
  const handleLogout = () => {
    localStorage.removeItem("wallet");
    localStorage.removeItem("signature");

    setUserAccount("");
    setLoginSuccess(false);
  };

  return (
    <div className="log-page-container">
      <div className="log-page-content">
        {!loginSuccess ? (
          <div className="login-section">
            <p className="login-description">MetaMask 로 안전하게 로그인하세요</p>

            {/* MetaMask 로그인 컴포넌트 */}
            <MetaMaskLogin
              onLoginSuccess={handleMetaMaskLoginSuccess}
              buttonText="MetaMask 지갑으로 로그인"
              className="metamask-login-btn"
            />

            {/* 에러 메시지 */}
            {error && (
              <div className="error-message">
                <p>{error}</p>
              </div>
            )}

            {/* 로딩 표시 */}
            {isLoading && (
              <div className="loading-indicator">
                <p>로그인 처리 중...</p>
              </div>
            )}
          </div>
        ) : (
          <div className="logged-in-section">
            <p className="success-message">로그인 성공!</p>
            <p className="account-info">
              연결된 계정: {userAccount.substring(0, 6)}...{userAccount.substring(userAccount.length - 4)}
            </p>

            <div className="action-buttons">
              <button onClick={() => navigate("/home")} className="go-home-button">
                홈으로 이동
              </button>
              <button onClick={handleLogout} className="logout-button">
                로그아웃
              </button>
            </div>
          </div>
        )}

        <div className="info-section">
          <h3>MetaMask 로그인 안내</h3>
          <p>
            MetaMask는 이더리움 블록체인과 상호 작용하는 안전한 지갑 서비스입니다. 웹브라우저 확장 프로그램을 설치하시면
            쉽게 사용하실 수 있습니다.
          </p>
          <p>
            아직 MetaMask가 없으신가요?{" "}
            <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer">
              여기
            </a>
            에서 설치하세요.
          </p>
        </div>
      </div>
    </div>
  );
}

export default LogPage;
