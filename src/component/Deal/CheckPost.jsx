import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../../styles/components/CheckPost.scss";
import ChattingList from "../Chat/ChattingList";

const CheckPost = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProductDetail = async () => {
      try {
        setLoading(true);
        // junggo_list API에서 전체 상품 목록을 가져옴
        const response = await fetch("https://www.wooajung.shop/junggo/junggo_list");

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const result = await response.json();

        // 전체 상품 목록에서 선택된 ID와 일치하는 상품만 필터링
        const selectedProduct = result.data.find((item) => item.id === parseInt(productId));

        if (!selectedProduct) {
          throw new Error("Product not found");
        }

        setProduct(selectedProduct);
        setLoading(false);
      } catch (err) {
        setError("상품 정보를 불러오는데 실패했습니다.");
        setLoading(false);
        console.error("Error fetching product details:", err);
      }
    };

    if (productId) {
      fetchProductDetail();
    }
  }, [productId]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}.${(date.getMonth() + 1).toString().padStart(2, "0")}.${date
      .getDate()
      .toString()
      .padStart(2, "0")}`;
  };

  const handleBuyClick = () => {
    // 로그인 확인
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      alert("로그인이 필요합니다.");
      navigate("/login"); // 로그인 페이지로 이동
      return;
    }

    // 채팅 UI 표시
    setShowChat(true);
    console.log(`채팅방 ${productId}로 이동합니다.`);
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleCloseChat = () => {
    setShowChat(false);
  };

  if (loading) return <div className="loading-message">상품 정보를 불러오는 중...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!product) return <div className="error-message">상품을 찾을 수 없습니다.</div>;

  // 채팅 UI가 활성화된 경우
  if (showChat) {
    // seller_id를 receiverId로 사용
    return (
      <ChattingList
        roomId={productId}
        receiverId={product.seller_id || 0}
        productInfo={{
          title: product.product,
          token: product.token,
          product: product.product,
        }}
        onClose={handleCloseChat}
      />
    );
  }

  // 상품 상세 정보 표시 모드
  return (
    <div className="product-detail-container">
      <div className="product-image-container">
        <img
          src={product.img_url || `https://source.unsplash.com/random/500x300/?product`}
          alt={product.product}
          className="product-detail-image"
        />
      </div>

      <div className="product-info-container">
        <div className="seller-profile">
          <div className="seller-name">{product.nickname}</div>
          <div className="seller-location">{product.trading_area}</div>
        </div>

        <div className="product-title-section">
          <h1 className="product-title">{product.product}</h1>
          <p className="product-description">{product.product_description}</p>
        </div>

        <div className="product-meta">
          <div className="product-condition">상태: {product.product_status}</div>
          <div className="product-date">등록일: {formatDate(product.createdAt)}</div>
          <div className="product-method">거래방식: {product.method}</div>
          {product.delivery_fee && <div className="product-delivery">배송비: {product.delivery_fee}</div>}
        </div>

        <div className="price-section">
          <h2 className="product-price">{product.token} USDT</h2>
        </div>

        <div className="action-buttons">
          <button className="buy-button" onClick={handleBuyClick}>
            채팅하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckPost;
