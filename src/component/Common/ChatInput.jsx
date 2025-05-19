import React from "react";
import send_icon from "../../assets/send_icon.svg";
import "../../styles/components/ChatInput.scss";

const ChatInput = ({ onSubmit, inputText, onInputChange, isDisabled }) => {
  return (
    <form className="chat-input" onSubmit={onSubmit}>
      <input
        type="text"
        placeholder="Start typing..."
        value={inputText}
        onChange={(e) => onInputChange(e.target.value)}
        disabled={isDisabled}
      />
      <button type="submit" className="send-button" disabled={isDisabled}>
        <span className="send-icon">
          <img src={send_icon} alt="send 아이콘" />
        </span>
      </button>
    </form>
  );
};

export default ChatInput;
