import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "../../styles/components/LoginCallback.scss"; // 필요시 스타일 파일 생성

function LoginCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginStatus, setLoginStatus] = useState("처리 중...");

  useEffect(() => {
    // URL에서 카카오 코드 파라미터 가져오기
    const queryParams = new URLSearchParams(location.search);
    const code = queryParams.get("kakao_code");

    if (code) {
      console.log("카카오 코드 감지:", code);
      handleKakaoLogin(code);
    } else {
      setError("코드 파라미터를 찾을 수 없습니다.");
      setIsLoading(false);
    }
  }, [location, navigate]);

  // 카카오 로그인 처리 함수
  const handleKakaoLogin = async (code) => {
    try {
      setLoginStatus("API 호출 중...");
      console.log("카카오 API 호출 코드:", code);

      // 백엔드 API 호출
      const response = await axios.get(`https://www.yunseo.store/api/oauth/kakao?code=${code}`);

      console.log("API 응답:", response.data);
      setLoginStatus("응답 처리 중...");

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
      setLoginStatus("로그인 성공! 홈 페이지로 이동합니다...");

      // 로그인 성공 후 홈페이지로 이동 (잠시 지연)
      setTimeout(() => {
        navigate("/home");
      }, 1000);
    } catch (error) {
      console.error("카카오 로그인 오류:", error);

      // 상세 에러 메시지 설정
      if (error.response) {
        const status = error.response.status;
        const errorMsg = error.response.data?.error || "알 수 없는 오류";
        setError(`로그인 처리 중 오류가 발생했습니다. (${status}: ${errorMsg})`);
      } else if (error.request) {
        setError("서버에 연결할 수 없습니다. 인터넷 연결을 확인해주세요.");
      } else {
        setError("로그인 처리 중 오류가 발생했습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-callback-container">
      <div className="login-callback-card">
        <h1>카카오 로그인</h1>

        {isLoading ? (
          <div className="loading-section">
            <div className="loading-spinner"></div>
            <p className="loading-text">{loginStatus}</p>
          </div>
        ) : error ? (
          <div className="error-section">
            <div className="error-icon">❌</div>
            <p className="error-message">{error}</p>
            <button className="return-button" onClick={() => navigate("/login")}>
              로그인 페이지로 돌아가기
            </button>
          </div>
        ) : (
          <div className="success-section">
            <div className="success-icon">✓</div>
            <p className="success-message">로그인 성공! 홈 페이지로 이동합니다...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default LoginCallback;
