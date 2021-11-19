import React, { useEffect, useReducer } from "react";
import Navbar from "./Navbar";
import TransactionForm from "./TransactionForm";
import { reducer } from "./reducer";
import { defaultState } from "./defaultState";

import axios from "axios";
import {
  isConnected,
  getPublicKey,
  signTransaction,
} from "@stellar/freighter-api";
import StellarSdk from "stellar-sdk";
function App() {
  const [state, dispatch] = useReducer(reducer, defaultState);
  const {
    publicKey,
    assetSend,
    assetReceive,
    amountSend,
    amountReceive,
    slippage,
  } = state;

  const fetchUrl = async (url) => {
    try {
      const response = await axios.get(url);
      const data = response.data;
      return data;
    } catch (e) {
      console.log(e);
      dispatch({ type: "ERROR_FETCH" });
    }
  };
  const submitXDR = async (url) => {
    try {
      const data = await fetchUrl(url);
      let xdr = data.xdr;
      xdr = await signTransaction(xdr, "TESTNET");
      const SERVER_URL = "https://horizon-testnet.stellar.org";
      const server = new StellarSdk.Server(SERVER_URL);
      const transactionToSubmit = StellarSdk.TransactionBuilder.fromXDR(
        xdr,
        SERVER_URL
      );
      const response = await server.submitTransaction(transactionToSubmit);
      console.log(response);
      dispatch({ type: "SUCCESS_SUBMIT_XDR" });
    } catch {
      dispatch({ type: "CANNOT_SUBMIT_XDR" });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      publicKey &&
      assetSend &&
      assetReceive &&
      amountSend &&
      amountReceive &&
      slippage
    ) {
      let url = "https://wy6y1k.deta.dev/fetch_xdr?";
      const params = [];
      params[0] = `public_key=${publicKey}&`;
      params[1] = `asset_send_code=${assetSend.code}&`;
      params[2] = `asset_send_issuer=${assetSend.issuer}&`;
      params[3] = `asset_receive_code=${assetReceive.code}&`;
      params[4] = `asset_receive_issuer=${assetReceive.issuer}&`;
      params[5] = `amount_send=${amountSend}&`;
      params[6] = `slippage=${slippage}`;
      params.forEach((param) => {
        url += param;
      });
      submitXDR(url);
    } else if (publicKey) {
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
        value = "";
      }
    }
    dispatch({ type: "CHANGE_VALUE", payload: { name, value } });
  };
  const closeNotification = () => {
    dispatch({ type: "CLOSE_NOTIFICATION" });
  };

  const loginFreighter = async () => {
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
    const name = "publicKey";
    const value = publicKey;
    dispatch({ type: "CHANGE_VALUE", payload: { name, value } });
  };

  const getAmountReceive = async (url) => {
    const name = "amountReceive";
    const value = await fetchUrl(url).then((data) => {
      return data.amount_receive;
    });
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
      const value = "";
      dispatch({
        type: "CHANGE_VALUE",
        payload: { name, value },
      });
    }
  }, [amountSend, assetSend, assetReceive]);
  return (
    <React.Fragment>
      <Navbar publicKey={publicKey} />
      {/* {isModalOpen && (
        <Modal closeModal={closeModal} modalContent={modalContent} />
      )} */}
      <TransactionForm
        state={state}
        handleSubmit={handleSubmit}
        handleChange={handleChange}
        loginFreighter={loginFreighter}
        closeNotification={closeNotification}
      />
    </React.Fragment>
  );
}

export default App;
