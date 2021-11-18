import React, { useEffect, useReducer } from "react";
import Modal from "./Modal";
import { listAsset } from "./listAsset";
import Asset from "./Asset";
import axios from "axios";
import {
  isConnected,
  getPublicKey,
  signTransaction,
} from "@stellar/freighter-api";
const reducer = (state, action) => {
  if (action.type === "SUBMIT_XDR") {
  } else if (action.type === "NO_VALUE") {
    return {
      ...state,
      isModalOpen: true,
      modalContent: "please enter value",
    };
  } else if (action.type === "CHANGE_VALUE") {
    const { name, value } = action.payload;
    console.log(name, value);
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

const defaultState = {
  publicKey: null,
  assetSend: null,
  assetReceive: null,
  amountSend: null,
  amountReceive: null,
  slippage: null,
  xdr: null,
  isModalOpen: false,
  modalContent: null,
};

const TransactionForm = () => {
  const [state, dispatch] = useReducer(reducer, defaultState);
  const {
    publicKey,
    assetSend,
    assetReceive,
    amountSend,
    amountReceive,
    slippage,
    xdr,
    isModalOpen,
    modalContent,
  } = state;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (amountSend && slippage && xdr) {
      dispatch({ type: "SUBMIT_XDR" });
    } else {
      dispatch({ type: "NO_VALUE" });
    }
  };

  const handleChange = (e) => {
    const name = e.target.name;
    let value = e.target.value;
    if (
      name === "amountSend" ||
      name === "amountReceive" ||
      name === "slippage"
    ) {
      if (value) {
        value = parseFloat(value);
      } else {
        value = null;
      }
    }
    dispatch({ type: "CHANGE_VALUE", payload: { name, value } });
  };
  const closeModal = () => {
    dispatch({ type: "CLOSE_MODAL" });
  };

  const loginFreighter = () => {
    const retrievePublicKey = async () => {
      let publicKey = "";
      let error = "";

      try {
        publicKey = await getPublicKey();
      } catch (e) {
        error = e;
      }

      if (error) {
        return error;
      }
      console.log(publicKey);
      return publicKey;
    };

    const name = "publicKey";
    const value = retrievePublicKey().then((publicKey) => publicKey);
    dispatch({ type: "", payload: { name, value } });
  };

  const fetchUrl = async (url) => {
    try {
      console.log(url);
      const response = await axios.get(url);
      const data = response.data;
      return data;
    } catch (e) {
      console.log(e);
      dispatch({ type: "ERROR_FETCH" });
    }
  };

  const getAmountReceive = async (url) => {
    const name = "amountReceive";
    const value = await fetchUrl(url).then((data) => {
      console.log(data.amount_receive);
      return data.amount_receive;
    });
    console.log(`the value is ${value}`);
    dispatch({
      type: "CHANGE_VALUE",
      payload: { name, value },
    });
  };

  useEffect(() => {
    if (amountSend && assetSend && assetReceive) {
      let url = "https://wy6y1k.deta.dev/fetch_amount_receive?";
      const params = [];
      params[0] = `asset_send_code=${assetSend.code}&`;
      params[1] = `asset_send_issuer=${assetSend.issuer}&`;
      params[2] = `asset_receive_code=${assetReceive.code}&`;
      params[3] = `asset_receive_issuer=${assetReceive.issuer}&`;
      params[4] = `amount_send=${amountSend}`;
      params.forEach((param) => {
        url += param;
      });
      getAmountReceive(url);
      const interval = setInterval(() => {
        getAmountReceive(url);
      }, 10000);

      return () => clearInterval(interval);
    } else if (!amountSend) {
      const name = "amountReceive";
      const value = null;
      dispatch({
        type: "CHANGE_VALUE",
        payload: { name, value },
      });
    }
  }, [amountSend, assetSend, assetReceive]);

  return (
    <>
      {isConnected() && <h1>user connected</h1>}
      {publicKey && <h1>user has login</h1>}
      <button onClick={loginFreighter}>login</button>
      {isModalOpen && (
        <Modal closeModal={closeModal} modalContent={modalContent} />
      )}
      <form onSubmit={handleSubmit}>
        <div className="form-control">
          <label htmlFor="amountSend">Amount Send</label>
          <input
            type="number"
            step={0.0000001}
            id="amountSend"
            name="amountSend"
            value={amountSend}
            onChange={handleChange}
            placeholder="0.0000000"
          />
        </div>
        <div className="form-control">
          <select name="assetSend" onChange={handleChange}>
            <option value="">Select Asset Type</option>
            {listAsset.map((asset) => {
              return <Asset key={asset.code} {...asset} />;
            })}
          </select>
        </div>
        <div className="form-control">
          <label htmlFor="amountReceive">Amount Receive</label>
          <input
            type="number"
            step={0.0000001}
            id="amountReceive"
            name="amountReceive"
            value={amountReceive}
            onChange={handleChange}
            placeholder="0.0000000"
          />
        </div>
        <div className="form-control">
          <select name="assetReceive" onChange={handleChange}>
            <option value="">Select Asset Type</option>
            {listAsset.map((asset) => {
              return <Asset key={asset.code} {...asset} />;
            })}
          </select>
        </div>
        <div className="form-control">
          <label htmlFor="slippage">Slippage : </label>
          <input
            type="number"
            step={0.01}
            id="slippage"
            name="slippage"
            value={slippage}
            onChange={handleChange}
            placeholder="value between 0-1"
            max="1.00"
            min="0.00"
          />
        </div>
        <button type="submit">submit</button>
      </form>
    </>
  );
};

export default TransactionForm;
