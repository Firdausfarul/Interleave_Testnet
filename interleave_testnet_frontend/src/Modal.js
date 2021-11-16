import React, { useEffect } from "react";

const Modal = ({ modalContent, closeModal }) => {
  useEffect(() => {
    console.log("enter");
    setTimeout(() => {
      closeModal();
    }, 3000);
    return () => {
      console.log("exit");
    };
  });
  return <div className="modal">{modalContent}</div>;
};

export default Modal;
