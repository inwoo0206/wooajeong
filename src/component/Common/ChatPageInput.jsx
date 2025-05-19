import React from "react";
import send_icon from "../../assets/send_icon.svg";
import "../../styles/components/ChatInput.scss";

const ChatPageInput = ({ onSubmit, inputText, setInputText, isDisabled = false }) => {
  const handleChange = (e) => {
    setInputText(e.target.value);
  };

  return (
    <form className="chat-input" onSubmit={onSubmit}>
      <input
        type="text"
        placeholder="Start typing..."
        value={inputText}
        onChange={handleChange}
        disabled={isDisabled}
      />
      <button type="submit" className="send-button" disabled={isDisabled || inputText.trim() === ""}>
        <span className="send-icon">
          <img src={send_icon} alt="send 아이콘" />
        </span>
      </button>
    </form>
  );
};

export default ChatPageInput;
