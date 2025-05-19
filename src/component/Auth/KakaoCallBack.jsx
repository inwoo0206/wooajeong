import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function KakaoCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  // const { login } = useAuth(); // 필요한 경우 주석 해제

  useEffect(() => {
    // URL에서 인증 코드 추출
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (!code) {
      setError("인증 코드가 없습니다.");
      setIsLoading(false);
      // 3초 후 로그인 페이지로 리다이렉트
      setTimeout(() => navigate("/login"), 3000);
      return;
    }

    // 백엔드 API 호출
    handleKakaoCallback(code);
  }, [navigate]);

  // 백엔드 API에 인증 코드 전송
  const handleKakaoCallback = async (code) => {
    try {
      // 백엔드 API 호출 - 올바른 API 엔드포인트 사용
      const response = await axios.get(`https://www.yunseo.store/api/oauth/kakao?code=${code}`);

      // 응답 처리
      const data = response.data;

      // 로그인 성공 시 토큰 및 사용자 정보 저장
      // 실제 응답 형식에 맞게 수정 필요
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // 컨텍스트 API를 사용하는 경우
      // login(data.user);

      // 홈페이지로 리다이렉트
      navigate("/");
    } catch (error) {
      console.error("카카오 로그인 오류:", error);

      // 상세 에러 메시지 설정
      if (error.response) {
        // 서버가 응답을 반환한 경우
        const status = error.response.status;
        const errorMsg = error.response.data.error || "알 수 없는 오류";

        setError(`서버 오류 (${status}): ${errorMsg}`);
      } else if (error.request) {
        // 요청은 보냈으나 응답을 받지 못한 경우
        setError("서버에 연결할 수 없습니다. 인터넷 연결을 확인해주세요.");
      } else {
        // 요청 설정 중 오류가 발생한 경우
        setError("로그인 처리 중 오류가 발생했습니다.");
      }

      // 3초 후 로그인 페이지로 리다이렉트
      setTimeout(() => navigate("/login"), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="kakao-callback-container">
      <div className="callback-card">
        <h2>카카오 로그인 처리 중</h2>

        {/* 로딩 상태 */}
        {isLoading && (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>로그인 정보를 처리하고 있습니다...</p>
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <p>곧 로그인 페이지로 이동합니다...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default KakaoCallback;
