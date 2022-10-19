import { useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/20/solid";

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
      style={{ background: notificationColor }}
      className=" text-white px-4 py-2 rounded-md border-2 border-gray-700 text-sm flex justify-between"
    >
      <span>{notificationContent}</span>
      <button onClick={closeNotification}>
        <XMarkIcon
          className="h-6 w-6 text-gray-100 hover:text-white duration-200 hover:scale-125 transform"
          aria-hidden="true"
        />
      </button>
    </div>
  );
};

export default Notification;
