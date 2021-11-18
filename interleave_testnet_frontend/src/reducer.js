export const reducer = (state, action) => {
  if (action.type === "SUCCESS_SUBMIT") {
    return {
      ...state,
      isModalOpen: true,
      modalContent: "success submit xdr",
    };
  } else if (action.type === "CANNOT_SUBMIT") {
    return {
      ...state,
      isModalOpen: true,
      modalContent: "cannot submit xdr",
    };
  } else if (action.type === "NO_VALUE") {
    return {
      ...state,
      isModalOpen: true,
      modalContent: "please enter value",
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
      isModalOpen: true,
      modalContent: "cannot fetch url",
    };
  } else if (action.type === "CLOSE_MODAL") {
    return {
      ...state,
      isModalOpen: false,
      modalContent: "",
    };
  }
};
