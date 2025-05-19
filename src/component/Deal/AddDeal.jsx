import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/components/AddDeal.scss";

const AddDeal = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // Form data state management
  const [formData, setFormData] = useState({
    token: "",
    product: "",
    product_status: "",
    method: "직거래", // Default value
    delivery_fee: "",
    trading_area: "",
    product_description: "",
  });

  // localStorage에서 access token을 가져오는 함수
  const getAuthToken = () => {
    // localStorage에서 accessToken 가져오기
    const token = localStorage.getItem("accessToken");

    // token이 없는 경우 처리
    if (!token) {
      console.error("Access token not found in localStorage");
      setError("로그인이 필요합니다. 로그인 페이지로 이동합니다.");

      // 로그인 페이지로 리다이렉트 (선택적으로 구현)
      setTimeout(() => {
        // navigate('/login');
      }, 2000);

      return null;
    }

    return token;
  };

  // Handle input field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "token" ? (value === "" ? "" : parseInt(value, 10)) : value,
    });
  };

  // Handle image file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!selectedFile) {
      setError("이미지를 업로드해주세요.");
      return;
    }

    if (!formData.product || !formData.token || !formData.product_description) {
      setError("물품명, 가격, 상세 설명은 필수 입력 항목입니다.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // localStorage에서 인증 토큰 가져오기
      const authToken = getAuthToken();

      // 토큰이 없으면 제출 중단
      if (!authToken) {
        setLoading(false);
        return;
      }

      // Create FormData object and add data
      const formDataToSend = new FormData();

      // Add image file - using 'file' key
      formDataToSend.append("file", selectedFile);

      // Add each field to the form data
      formDataToSend.append("token", formData.token);
      formDataToSend.append("product", formData.product);
      formDataToSend.append("product_status", formData.product_status);
      formDataToSend.append("method", formData.method);
      formDataToSend.append("delivery_fee", formData.delivery_fee);
      formDataToSend.append("trading_area", formData.trading_area);
      formDataToSend.append("product_description", formData.product_description);

      // Debug: Check data being sent to server
      console.log("서버로 전송되는 데이터:", {
        token: formData.token,
        product: formData.product,
        product_status: formData.product_status,
        method: formData.method,
        delivery_fee: formData.delivery_fee,
        trading_area: formData.trading_area,
        product_description: formData.product_description,
        file: selectedFile.name,
      });

      // Bearer 인증 형식으로 API 요청
      const response = await fetch("https://www.wooajung.shop/junggo/create", {
        method: "POST",
        body: formDataToSend,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("서버 응답:", errorText);

        try {
          // Try to parse as JSON
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.message || "물품 등록에 실패했습니다.");
        } catch (e) {
          // Use original text if parsing fails
          throw new Error(`물품 등록에 실패했습니다: ${errorText}`);
        }
      }

      const result = await response.json();

      // 서버 응답 데이터를 콘솔에 출력
      console.log("등록 성공:", result);
      console.log("반환된 물품 데이터:", {
        message: "물품이 성공적으로 등록되었습니다.",
        data: {
          id: result.data.id,
          nickname: result.data.nickname,
          token: result.data.token,
          product: result.data.product,
          createdAt: result.data.createdAt,
          product_status: result.data.product_status,
          method: result.data.method,
          delivery_fee: result.data.delivery_fee,
          trading_area: result.data.trading_area,
          product_description: result.data.product_description,
          img_url: result.data.img_url,
        },
      });

      // 반환된 상품 ID로 채팅방 생성 API 호출
      const productId = result.data.id;
      console.log(`상품 ID ${productId}로 채팅방 생성 API 호출`);

      try {
        // 직접 localStorage에서 accessToken 가져오기
        const accessToken = localStorage.getItem("accessToken");

        const chatRoomResponse = await fetch(`https://www.yunseo.store/room/make?productId=${productId}`, {
          method: "POST", // GET에서 POST로 변경
          headers: {
            Authorization: `Bearer ${accessToken}`, // Bearer 없이 토큰만 전달
            "Content-Type": "application/json",
          },
        });

        if (!chatRoomResponse.ok) {
          throw new Error("채팅방 생성에 실패했습니다.");
        }

        const chatRoomResult = await chatRoomResponse.json();
        console.log("채팅방 생성 성공:", chatRoomResult);
        console.log("채팅방 정보:", {
          roomId: chatRoomResult.roomId,
          roomLink: chatRoomResult.roomLink,
          creatorId: chatRoomResult.creatorId,
          opponentId: chatRoomResult.opponentId,
          createdAt: chatRoomResult.createdAt,
        });
      } catch (chatError) {
        console.error("채팅방 생성 중 오류 발생:", chatError);
      }

      setSuccess(true);

      // Redirect after success
      setTimeout(() => {
        alert("물품이 등록되었습니다!");
      }, 3000);
    } catch (err) {
      setError(err.message || "물품 등록 중 오류가 발생했습니다.");
      console.error("Error submitting form:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-deal-container">
      <h1 className="add-deal-title">중고물품 판매를 시작해보세요!</h1>

      {success && <div className="success-message">등록이 완료되었습니다! 잠시 후 상품 상세 페이지로 이동합니다.</div>}

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="add-deal-form">
        {/* Image upload section */}
        <div className="image-upload-section">
          <div className="image-preview" onClick={() => document.getElementById("file-input").click()}>
            {imagePreview ? (
              <img src={imagePreview} alt="상품 이미지 미리보기" />
            ) : (
              <div className="upload-placeholder">
                <i className="upload-icon">+</i>
                <p>이미지를 업로드하세요</p>
                <p className="upload-desc">(클릭하여 파일 선택)</p>
              </div>
            )}
          </div>
          <input type="file" id="file-input" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
        </div>

        {/* Product information form */}
        <div className="form-section">
          <div className="form-group">
            <label htmlFor="product">물품명 *</label>
            <input
              type="text"
              id="product"
              name="product"
              value={formData.product}
              onChange={handleChange}
              placeholder="판매할 물품의 이름을 입력하세요"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="token">가격 (USDT) *</label>
            <input
              type="number"
              id="token"
              name="token"
              value={formData.token}
              onChange={handleChange}
              placeholder="가격을 입력하세요 (USDT)"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="product_status">제품 상태 *</label>
            <input
              type="text"
              id="product_status"
              name="product_status"
              value={formData.product_status}
              onChange={handleChange}
              placeholder="제품의 상태를 입력하세요"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="method">거래 방식</label>
            <select id="method" name="method" value={formData.method} onChange={handleChange}>
              <option value="직거래">직거래</option>
              <option value="택배">택배</option>
              <option value="둘다가능">둘다가능</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="delivery_fee">배송비</label>
            <input
              type="text"
              id="delivery_fee"
              name="delivery_fee"
              value={formData.delivery_fee}
              onChange={handleChange}
              placeholder="배송비 (택배인 경우 입력)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="trading_area">거래 희망지역</label>
            <input
              type="text"
              id="trading_area"
              name="trading_area"
              value={formData.trading_area}
              onChange={handleChange}
              placeholder="거래를 원하는 지역 (직거래인 경우 입력)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="product_description">상세 설명 *</label>
            <textarea
              id="product_description"
              name="product_description"
              value={formData.product_description}
              onChange={handleChange}
              placeholder="상품에 대한 상세 설명을 입력하세요"
              rows="5"
              required
            ></textarea>
          </div>

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? "등록 중..." : "상품 등록하기"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddDeal;
