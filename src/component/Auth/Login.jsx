import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "../../styles/components/Login.scss";
import kakao from "../../assets/kakao.svg";
// import { useAuth } from "../../context/AuthContext";

// MetaMask 모달 컴포넌트
const MetaMaskModal = ({ onClose }) => {
  const [status, setStatus] = useState("");
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState("");
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);

  // 컴포넌트 마운트 시 MetaMask 설치 여부 확인
  useEffect(() => {
    // MetaMask가 설치되어 있는지 확인
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

  const connectMetaMask = async () => {
    try {
      setStatus("MetaMask에 연결 중...");

      // MetaMask가 설치되어 있는지 한 번 더 확인
      if (!window.ethereum) {
        throw new Error("MetaMask가 설치되어 있지 않습니다");
      }

      // MetaMask 계정 접근 요청
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const userAccount = accounts[0];

      // 계정 정보 저장
      setAccount(userAccount);
      setConnected(true);

      // 성공 메시지 표시
      setStatus(`연결됨: ${userAccount.substring(0, 6)}...${userAccount.substring(userAccount.length - 4)}`);

      // 인증을 위한 서명 생성
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

      // 잠시 후 홈페이지로 이동
      setTimeout(() => {
        onClose(); // 모달 닫기
        window.location.href = "/home"; // 홈 페이지로 이동
      }, 2000);
    } catch (error) {
      console.error("MetaMask 연결 오류", error);
    }
  };

  // MetaMask 확장 프로그램 설치 페이지로 이동
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
          // MetaMask가 설치된 경우
          <>
            <p>애플리케이션에 접근하려면 MetaMask 지갑을 연결하세요</p>
            <button className="metamask-button" onClick={connectMetaMask} disabled={connected}>
              MetaMask로 연결하기
            </button>
          </>
        ) : (
          // MetaMask가 설치되지 않은 경우
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

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showMetaMaskModal, setShowMetaMaskModal] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [inputCode, setInputCode] = useState("");
  const codeInputRef = useRef(null);

  // 백엔드에서 설정한 정보
  const KAKAO_REST_API_KEY = "e0f7c861c1363c8c05d661936397b603";
  // 원래 리다이렉트 URI 사용
  const REDIRECT_URI = "https://www.yunseo.store/oauth/kakao/callback";

  // 코드 입력 폼 제출
  const handleCodeFormSubmit = (e) => {
    e.preventDefault();

    if (inputCode.trim()) {
      handleKakaoLogin(inputCode.trim());
    }
  };

  // 코드 입력 UI가 표시될 때 포커스 설정
  useEffect(() => {
    if (showCodeInput && codeInputRef.current) {
      codeInputRef.current.focus();
    }
  }, [showCodeInput]);

  // MetaMask 로그인 처리
  const handleMetaMaskLogin = () => {
    setShowMetaMaskModal(true);
  };

  // MetaMask 모달 닫기
  const closeMetaMaskModal = () => {
    setShowMetaMaskModal(false);
  };

  // 카카오 로그인 창 열기 - 원래 리다이렉트 URI 사용
  const initiateKakaoLogin = () => {
    setIsLoading(true);

    // 현재 창에서 카카오 인증 페이지 열기
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_REST_API_KEY}&redirect_uri=${REDIRECT_URI}&response_type=code`;

    // 새 창에서 열기 (callback URL에서 코드를 가져오기 위해)
    const kakaoLoginWindow = window.open(kakaoAuthUrl, "_blank");

    // 로딩 상태 해제
    setIsLoading(false);

    // 배너 또는 안내 메시지 표시
    setError(null); // 이전 에러 메시지 제거

    // 안내 메시지 표시
    setTimeout(() => {
      setShowCodeInput(true);
    }, 1000);
  };

  // 카카오 로그인 처리 함수
  const handleKakaoLogin = async (code) => {
    setIsLoading(true);

    try {
      console.log("카카오 API 호출 코드:", code);

      // 백엔드 API 호출
      const response = await axios.get(`https://www.yunseo.store/api/oauth/kakao?code=${code}`);

      console.log("API 응답:", response.data);

      // 응답 처리
      const data = response.data;

      // 액세스 토큰 콘솔에 출력 및 저장
      if (data.accessToken) {
        console.log("액세스 토큰:", data.accessToken);
        localStorage.setItem("accessToken", data.accessToken);
      }

      // 리프레시 토큰이 있으면 저장
      if (data.refreshToken) {
        console.log("리프레시 토큰:", data.refreshToken);
        localStorage.setItem("refreshToken", data.refreshToken);
      }

      // 사용자 정보가 있으면 함께 출력 및 저장
      if (data.user) {
        console.log("사용자 정보:", data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      console.log("카카오 로그인 성공! 토큰이 저장되었습니다.");

      // 로그인 성공 후 홈페이지로 이동
      navigate("/home");
    } catch (error) {
      console.error("카카오 로그인 오류:", error);
      setError("로그인 처리 중 오류가 발생했습니다.");

      // 상세 에러 메시지 콘솔에 출력
      if (error.response) {
        const status = error.response.status;
        const errorMsg = error.response.data?.error || "알 수 없는 오류";
        console.error(`로그인 처리 중 오류가 발생했습니다. (${status}: ${errorMsg})`);
        setError(`로그인 처리 중 오류가 발생했습니다. (${status}: ${errorMsg})`);
      } else if (error.request) {
        console.error("서버에 연결할 수 없습니다. 인터넷 연결을 확인해주세요.");
        setError("서버에 연결할 수 없습니다. 인터넷 연결을 확인해주세요.");
      } else {
        console.error("로그인 처리 중 오류가 발생했습니다.");
        setError("로그인 처리 중 오류가 발생했습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h1 className="login-title">Login</h1>
      <div className="login-card">
        <p className="login-description">AI로 안전하고 스마트한 중고거래 경험을 만나보세요!</p>

        {/* metamask 로그인 버튼 */}
        <button className="meta-login-button" onClick={handleMetaMaskLogin} disabled={isLoading}>
          {"MetaMask 로그인 하기"}
        </button>

        {/* 카카오 로그인 버튼 */}
        <button className="kakao-login-button" onClick={initiateKakaoLogin} disabled={isLoading}>
          <span className="kakao-icon">
            <img src={kakao} alt="카카오 아이콘" />
          </span>
          {isLoading ? "로그인 처리 중..." : "카카오 계정으로 1초 만에 시작하기"}
        </button>

        {/* 에러 메시지 */}
        {error && (
          <div className="error-message" style={{ color: "red", marginTop: "15px" }}>
            <p>{error}</p>
          </div>
        )}

        {/* 로딩 표시 */}
        {isLoading && (
          <div className="loading-indicator" style={{ marginTop: "15px" }}>
            <p>로그인 처리 중...</p>
          </div>
        )}

        {/* 코드 입력 폼 */}
        {showCodeInput && (
          <div className="code-input-form" style={{ marginTop: "15px" }}>
            <form onSubmit={handleCodeFormSubmit}>
              <p style={{ marginBottom: "8px", fontSize: "14px" }}>
                카카오 로그인 후 URL에서 <strong>code=</strong> 다음에 오는 값을 붙여넣으세요.
              </p>
              <div style={{ display: "flex" }}>
                <input
                  ref={codeInputRef}
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder="코드 붙여넣기"
                  style={{
                    flex: 1,
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "4px 0 0 4px",
                  }}
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputCode.trim()}
                  style={{
                    padding: "10px 15px",
                    backgroundColor: "#FEE500",
                    color: "#000",
                    border: "1px solid #FEE500",
                    borderRadius: "0 4px 4px 0",
                    cursor: "pointer",
                  }}
                >
                  로그인
                </button>
              </div>
            </form>
          </div>
        )}

        {/* MetaMask 모달 */}
        {showMetaMaskModal && <MetaMaskModal onClose={closeMetaMaskModal} />}
      </div>
    </div>
  );
}

export default Login;
