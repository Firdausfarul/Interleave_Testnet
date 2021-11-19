export const reducer = (state, action) => {
  if (action.type === "SUCCESS_SUBMIT_XDR") {
    return {
      ...state,
      isNotificationOpen: true,
      notificationContent: "Transaction Success",
      notificationColor: "#2eb94c",
    };
  } else if (action.type === "CANNOT_SUBMIT_XDR") {
    return {
      ...state,
      isNotificationOpen: true,
      notificationContent: "Transaction Failed",
      notificationColor: "#ec5f0d",
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
    if (name === "assetSend" || name === "assetReceive") {
      const [newCode, newIssuer] = value.split("_");
      return {
        ...state,
        [name]: {
          code: newCode,
          issuer: newIssuer,
        },
      };
    }
    return {
      ...state,
      [name]: value,
    };
  } else if (action.type === "ERROR_FETCH") {
    return {
      ...state,
      isNotificationOpen: true,
      notificationContent: "Error Retrieve Data",
      notificationColor: "#ec5f0d",
    };
  } else if (action.type === "CLOSE_NOTIFICATION") {
    return {
      ...state,
      isNotificationOpen: false,
      notificationContent: null,
      notificationColor: null,
    };
  }
};
