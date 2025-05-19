import React, { useEffect, useRef, useState } from "react";

const parseProductList = (text) => {
  const regex = /\*\*(.*?)\*\* - 가격: ([\d,]+원) - !\[이미지\]\((.*?)\) - \[상품 상세보기\]\((.*?)\)/g;
  const results = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    results.push({
      title: match[1],
      price: match[2],
      image: match[3],
      link: match[4],
    });
  }

  return results;
};

const ProductList = ({ token }) => {
  const [products, setProducts] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    const ws = new WebSocket(`ws://146.148.57.121/ws/solchat?token=${token}`);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log("웹소켓 연결됨");
    };

    ws.onmessage = (event) => {
      try {
        const response = JSON.parse(event.data);
        console.log("응답 확인:", response);

        // ✅ type이 history인 경우 처리
        if (response.type === "history") {
          const assistantMessages = response.data.filter((item) => item.role === "assistant");

          const lastAssistant = assistantMessages
            .map((m) => m.content)
            .reverse()
            .find((msg) => msg.includes("중고 노트북") && msg.includes("다음은"));

          if (lastAssistant) {
            const parsed = parseProductList(lastAssistant);
            console.log("파싱된 상품:", parsed);
            setProducts(parsed);
          }

          return;
        }

        // ✅ 실시간 메시지 수신도 처리 (필요한 경우)
        if (response.message) {
          const text = response.message;
          if (text.includes("중고 노트북") && text.includes("다음은")) {
            const parsed = parseProductList(text);
            console.log("파싱된 상품:", parsed);
            setProducts(parsed);
          }
        }
      } catch (err) {
        console.error("파싱 에러:", err);
      }
    };

    return () => {
      if (socketRef.current) socketRef.current.close();
    };
  }, [token]);

  return (
    <div>
      <h2>💻 중고 노트북 추천 매물</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
        {products.map((product, index) => (
          <div
            key={index}
            style={{
              border: "1px solid #ccc",
              padding: "12px",
              width: "200px",
              borderRadius: "8px",
              boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
            }}
          >
            <img src={product.image} alt={product.title} style={{ width: "100%", borderRadius: "4px" }} />
            <h4>{product.title}</h4>
            <p>{product.price}</p>
            <a href={product.link} target="_blank" rel="noopener noreferrer">
              🔗 상품 상세보기
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductList;
