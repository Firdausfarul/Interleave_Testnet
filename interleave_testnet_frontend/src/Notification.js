import React, { useEffect } from "react";

const Notification = ({
  notificationContent,
  notificationColor,
  closeNotification,
}) => {
  useEffect(() => {
    setTimeout(() => {
      closeNotification();
    }, 10000);
  });
  return (
    <div
      className="notification"
      style={{ backgroundColor: notificationColor }}
    >
      <div className="notification-content">{notificationContent}</div>
    </div>
  );
};

export default Notification;
