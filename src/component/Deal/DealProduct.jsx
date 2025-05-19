import React, { useState, useEffect } from "react";
import "../../styles/components/DealProduct.scss";
import { useNavigate } from "react-router-dom";

const DealProduct = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch("https://www.wooajung.shop/junggo/junggo_list");
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        setProducts(
          data.data.map((product) => ({
            ...product,
            isLiked: false, // 모든 제품에 isLiked 속성 초기화
          }))
        );
        setLoading(false);
      } catch (err) {
        setError("상품 정보를 불러오는데 실패했습니다.");
        setLoading(false);
        console.error("Error fetching products:", err);
      }
    };

    fetchProducts();
  }, []);

  // 날짜를 상품 등록 후 얼마나 지났는지 표시하는 형식으로 변환
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 60) {
      return `${diffInMinutes}분 전`;
    } else if (diffInHours < 24) {
      return `${diffInHours}시간 전`;
    } else {
      return `${diffInDays}일 전`;
    }
  };

  const handleSellClick = () => {
    navigate("/adddeal");
  };

  // 제품 카드 클릭 시 상세 페이지로 이동하는 함수 추가
  const handleProductClick = (productId) => {
    navigate(`/list/${productId}`);
  };

  if (loading) return <div className="loading-message">상품 정보를 불러오는 중...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="deal-product-container">
      <div className="deal-product-title">진행 중인 거래들을 확인 해보세요!</div>
      <div className="deal-product-list">
        {products.map((product) => (
          <div
            key={product.id}
            className="product-card"
            onClick={() => handleProductClick(product.id)}
            style={{ cursor: "pointer" }} // 클릭 가능함을 시각적으로 표시
          >
            <div className="card-image-container">
              <img
                src={product.img_url || `https://source.unsplash.com/random/300x200/?product`}
                alt={product.product}
                className="card-image"
              />
              <div className="tag-container">
                {product.method === "직거래" && <span className="tag direct-deal">직거래</span>}
                {product.method === "택배" && <span className="tag delivery">택배</span>}
              </div>
            </div>

            <div className="card-content">
              <div className="product-info">
                <h3 className="product-name">{product.product_description}</h3>
                <div className="specs">
                  <span>{product.product_status}</span>
                  {product.trading_area && <span> • {product.trading_area}</span>}
                </div>
                <div className="time">{formatDate(product.createdAt)}</div>
              </div>

              <div className="price-info">
                <div className="price-container">
                  <h3 className="price">{product.token}USDT</h3>
                  {product.delivery_fee && <span className="delivery-fee">배송비 {product.delivery_fee}</span>}
                </div>

                <div className="seller-info">
                  <span className="seller-name">{product.nickname}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button className="sell-button" onClick={handleSellClick}>
        판매하기
      </button>
    </div>
  );
};

export default DealProduct;
