import React, { useState, useEffect } from "react";
import "../../styles/components/MetamaskLogin.scss";

/**
 * MetaMask 로그인 모달 컴포넌트
 */
const MetaMaskModal = ({ onClose, onLoginSuccess }) => {
  const [status, setStatus] = useState("");
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState("");
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);

  // 컴포넌트 마운트 시 MetaMask 설치 여부 확인
  useEffect(() => {
    const checkIfMetaMaskIsInstalled = () => {
      if (typeof window !== "undefined" && window.ethereum) {
        setIsMetaMaskInstalled(true);
      } else {
        setIsMetaMaskInstalled(false);
        setStatus("MetaMask가 설치되어 있지 않습니다. 계속하려면 MetaMask를 설치하세요.");
      }
    };

    checkIfMetaMaskIsInstalled();
  }, []);

  // MetaMask 연결 함수
  const connectMetaMask = async () => {
    try {
      setStatus("MetaMask에 연결 중...");

      if (!window.ethereum) {
        throw new Error("MetaMask가 설치되어 있지 않습니다");
      }

      // 계정 요청
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const userAccount = accounts[0];

      setAccount(userAccount);
      setConnected(true);
      setStatus(`연결됨: ${userAccount.substring(0, 6)}...${userAccount.substring(userAccount.length - 4)}`);

      // 서명 요청
      const message = `우리 애플리케이션에 로그인 ${new Date().toISOString()}`;
      const signature = await window.ethereum.request({
        method: "personal_sign",
        params: [message, userAccount],
      });

      console.log("계정:", userAccount);
      console.log("서명:", signature);

      // 로그인 정보 저장
      localStorage.setItem("wallet", userAccount);
      localStorage.setItem("signature", signature);

      // 성공 콜백 호출
      if (onLoginSuccess) {
        onLoginSuccess(userAccount, signature);
      }

      // 잠시 후 모달 닫기
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error("MetaMask 연결 오류", error);
      setStatus(`연결 오류: ${error.message || "알 수 없는 오류가 발생했습니다"}`);
    }
  };

  // MetaMask 설치 페이지로 이동
  const redirectToMetaMaskInstall = () => {
    window.open("https://metamask.io/download/", "_blank");
  };

  return (
    <div className="metamask-modal-overlay">
      <div className="metamask-modal">
        <div className="modal-header">
          <h2>MetaMask로 연결하기</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        {isMetaMaskInstalled ? (
          <>
            <p>애플리케이션에 접근하려면 MetaMask 지갑을 연결하세요</p>
            <button className="metamask-button" onClick={connectMetaMask} disabled={connected}>
              MetaMask로 연결하기
            </button>
          </>
        ) : (
          <>
            <p>MetaMask가 설치되어 있지 않습니다. 계속하려면 MetaMask를 설치하세요.</p>
            <button className="metamask-button" onClick={redirectToMetaMaskInstall}>
              <img src="https://metamask.io/images/metamask-fox.svg" alt="MetaMask 로고" className="metamask-logo" />
              MetaMask 설치하기
            </button>
          </>
        )}

        <div className="status-message">{status}</div>
      </div>
    </div>
  );
};

/**
 * MetaMask 로그인 버튼 컴포넌트
 */
const MetaMaskLogin = ({ onLoginSuccess, buttonText = "MetaMask 로그인 하기", className = "meta-login-button" }) => {
  const [showMetaMaskModal, setShowMetaMaskModal] = useState(false);

  const handleMetaMaskLogin = () => {
    setShowMetaMaskModal(true);
  };

  const closeMetaMaskModal = () => {
    setShowMetaMaskModal(false);
  };

  const handleModalLoginSuccess = (account, signature) => {
    if (onLoginSuccess) {
      onLoginSuccess(account, signature);
    }
  };

  return (
    <>
      <button className={className} onClick={handleMetaMaskLogin}>
        {buttonText}
      </button>

      {showMetaMaskModal && <MetaMaskModal onClose={closeMetaMaskModal} onLoginSuccess={handleModalLoginSuccess} />}
    </>
  );
};

export default MetaMaskLogin;
export { MetaMaskModal };
