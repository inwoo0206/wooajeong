import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import "../../styles/layout/Sidebar.scss";
import chat_icon from "../../assets/chat_icon.svg";
import home_icon from "../../assets/home.svg";
import shopping_icon from "../../assets/shopping_icon.svg";
import profile_icon from "../../assets/profile_icon.svg";
import deal_icon from "../../assets/deal_icon.svg";
import coin_icon from "../../assets/coin.svg";
import list_icon from "../../assets/checklist.svg";
// import { useAuth } from "../../context/AuthContext";

function Sidebar() {
  // const { user } = useAuth();
  const [tokenBalance, setTokenBalance] = useState(0);

  // Function to get the authentication token
  const getAuthToken = () => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      console.error("Access token not found in localStorage");
      return null;
    }

    return token;
  };

  // Function to fetch token balance
  const fetchTokenBalance = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch("https://www.wooajung.shop/blockchain/coinBalance", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch token balance");
      }
      const data = await response.json();
      setTokenBalance(data.token);
    } catch (error) {
      console.error("Error fetching token balance:", error);
    }
  };

  useEffect(() => {
    // Fetch the token balance when component mounts
    fetchTokenBalance();

    // Listen for token balance updates from Profile component
    const handleTokenUpdate = (event) => {
      setTokenBalance(event.detail);
    };

    // Add event listener
    window.addEventListener("tokenBalanceUpdated", handleTokenUpdate);

    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener("tokenBalanceUpdated", handleTokenUpdate);
    };
  }, []);

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1 className="app-title">우아정</h1>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => `sidebar-nav-item ${isActive ? "active" : ""}`}>
          <span className="nav-icon">
            <img src={home_icon} alt="home 아이콘" />
          </span>
          <span>Home</span>
        </NavLink>

        <NavLink to="/interest" className={({ isActive }) => `sidebar-nav-item ${isActive ? "active" : ""}`}>
          <span className="nav-icon">
            <img src={shopping_icon} alt="shopping 아이콘" />
          </span>
          <span>관심사 등록하기</span>
        </NavLink>

        <NavLink to="/list" className={({ isActive }) => `sidebar-nav-item ${isActive ? "active" : ""}`}>
          <span className="nav-icon">
            <img src={list_icon} alt="checklist 아이콘" />
          </span>
          <span>중고거래 목록</span>
        </NavLink>

        <NavLink to="/chat" className={({ isActive }) => `sidebar-nav-item ${isActive ? "active" : ""}`}>
          <span className="nav-icon">
            <img src={chat_icon} alt="chat 아이콘" />
          </span>
          <span>채팅하기</span>
        </NavLink>

        <NavLink to="/deal" className={({ isActive }) => `sidebar-nav-item ${isActive ? "active" : ""}`}>
          <span className="nav-icon">
            <img src={deal_icon} alt="deal 아이콘" />
          </span>
          <span>진행중인 거래</span>
        </NavLink>

        <NavLink to="/profile" className={({ isActive }) => `sidebar-nav-item ${isActive ? "active" : ""}`}>
          <span className="nav-icon">
            <img src={profile_icon} alt="profile 아이콘" />
          </span>
          <span>프로필</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        {tokenBalance !== null && (
          <div className="token-balance">
            <img src={coin_icon} alt="coin 아이콘" />
            <span className="token-label">보유 USDT :</span>
            <span className="token-amount">{tokenBalance}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default Sidebar;
