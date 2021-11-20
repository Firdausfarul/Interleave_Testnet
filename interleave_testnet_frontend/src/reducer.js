export const reducer = (state, action) => {
  if (action.type === "SUCCESS_SUBMIT_XDR") {
    return {
      ...state,
      isNotificationOpen: true,
      notificationContent: "Transaction Success",
      notificationColor: "#2eb94c",
      isSubmitting: false,
    };
  } else if (action.type === "CANNOT_SUBMIT_XDR") {
    return {
      ...state,
      isNotificationOpen: true,
      notificationContent: "Transaction Failed",
      notificationColor: "#ec5f0d",
      isSubmitting: false,
    };
  } else if (action.type === "NO_VALUE") {
    return {
      ...state,
      isNotificationOpen: true,
      notificationContent:
        "Please Enter Amount Send, Asset Send, and Asset Receive",
      notificationColor: "#ec5f0d",
    };
  } else if (action.type === "CHANGE_VALUE") {
    const { name, value } = action.payload;
    return {
      ...state,
      [name]: value,
    };
  } else if (action.type === "CLOSE_NOTIFICATION") {
    return {
      ...state,
      isNotificationOpen: false,
      notificationContent: null,
      notificationColor: null,
    };
  } else if (action.type === "FREIGHTER_NOT_INSTALLED") {
    return {
      ...state,
      isNotificationOpen: true,
      notificationContent: "You Must Install Freighter In Your Browser",
      notificationColor: "#ec5f0d",
    };
  } else if (action.type === "CANNOT_GET_AMOUNT_RECEIVE") {
    return {
      ...state,
      isNotificationOpen: true,
      notificationContent: "Cannot Get Amount Receive",
      notificationColor: "#ec5f0d",
    };
  } else if (action.type === "CANNOT_GET_LIST_ASSET") {
    return {
      ...state,
      isNotificationOpen: true,
      notificationContent: "Cannot Get List Asset",
      notificationColor: "#ec5f0d",
    };
  } else if (action.type === "CANNOT_LOGIN") {
    return {
      ...state,
      isNotificationOpen: true,
      notificationContent: "Cannot Login",
      notificationColor: "#ec5f0d",
    };
  } else if (action.type === "PROCESSING_TRANSACTION") {
    return {
      ...state,
      isNotificationOpen: true,
      notificationContent: "Processing Transaction",
      notificationColor: "#ec5f0d",
      isSubmitting: true,
    };
  }
};
