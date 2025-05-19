import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.scss";
import Layout from "./component/Layout/Layout";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import ChatPage from "./pages/ChatPage";
import AddProductPage from "./pages/AddProductPage";
import ChatRoomPage from "./pages/ChatRoomPage";
// import ProductListPage from "./pages/ProductListPage";
import ProfilePage from "./pages/ProfilePage";
import KakaoCallback from "./component/Auth/KakaoCallBack";
import CheckDealPage from "./pages/CheckDealPage";
import DealPage from "./pages/DealPage";
import AddDealPage from "./pages/AddDealPage";
import LoginCallback from "./component/Auth/LoginCallBack";
import CheckPostPage from "./pages/CheckPostPage";
// import { AuthProvider } from "./context/AuthContext";
// import { ChatProvider } from "./context/ChatContext";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/oauth/kakao/callback" element={<LoginPage />} />
      <Route path="/login-callback" element={<LoginCallback />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/interest" element={<AddProductPage />} />
      <Route path="/list" element={<DealPage />} />
      <Route path="/list/:productId" element={<CheckPostPage />} />
      <Route path="/adddeal" element={<AddDealPage />} />
      <Route path="/deal" element={<CheckDealPage />} />
      <Route path="/chat/:roomId" element={<ChatRoomPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/" element={<Layout />}>
        <Route path="asasas" element={<HomePage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/myprofile" element={<ProfilePage />} />
      </Route>
    </Routes>
  );
}

export default App;
