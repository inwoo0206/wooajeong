import axios from "axios";

// 카카오 인증 코드로 로그인 처리하는 함수
export const processKakaoLogin = async (code) => {
  try {
    // 백엔드 API 호출
    const response = await axios.get(`https://www.yunseo.store/api/oauth/kakao?code=${code}`);

    // 로그인 성공 시 토큰 및 사용자 정보 저장
    const data = response.data;

    // 토큰 저장
    localStorage.setItem("token", data.token);

    // 사용자 정보 저장
    localStorage.setItem("user", JSON.stringify(data.user));

    return {
      success: true,
      data,
    };
  } catch (error) {
    // 오류 처리
    console.error("카카오 로그인 오류:", error);

    let errorMessage = "로그인 처리 중 오류가 발생했습니다.";

    if (error.response) {
      const status = error.response.status;
      const errorMsg = error.response.data.error || "알 수 없는 오류";
      errorMessage = `서버 오류 (${status}): ${errorMsg}`;
    } else if (error.request) {
      errorMessage = "서버에 연결할 수 없습니다. 인터넷 연결을 확인해주세요.";
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
};

// URL에서 카카오 인증 코드 추출하는 함수
export const extractKakaoCode = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("code");
};

// 카카오 로그인 페이지로 리다이렉트하는 함수
export const redirectToKakaoAuth = () => {
  const KAKAO_REST_API_KEY = "e0f7c861c1363c8c05d661936397b603";
  const REDIRECT_URI = "https://www.yunseo.store/oauth/kakao/callback";

  window.location.href = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_REST_API_KEY}&redirect_uri=${REDIRECT_URI}&response_type=code`;
};

// 브라우저 히스토리에서 현재 URL 제거하고 새 URL로 교체하는 함수
export const replaceCurrentUrl = (newPath) => {
  window.history.replaceState({}, document.title, newPath);
};
