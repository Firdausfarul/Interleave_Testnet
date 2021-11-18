import React, { useEffect, useReducer } from "react";
import Modal from "./Modal";
import { listAsset } from "./listAsset";
import { reducer } from "./reducer";
import { defaultState } from "./defaultState";
import { Asset } from "./Asset";
import axios from "axios";
import {
  isConnected,
  getPublicKey,
  signTransaction,
} from "@stellar/freighter-api";
import StellarSdk from "stellar-sdk";

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
      const name = "xdr";
      const data = await fetchUrl(url);
      let value = data.xdr;
      console.log(name, value);
      dispatch({
        type: "CHANGE_VALUE",
        payload: { name, value },
      });
      value = await signTransaction(xdr, "TESTNET");
      dispatch({
        type: "CHANGE_VALUE",
        payload: { name, value },
      });
      console.log("the transaction", xdr);
      const SERVER_URL = "https://horizon-testnet.stellar.org";
      const server = new StellarSdk.Server(SERVER_URL);
      const transactionToSubmit = StellarSdk.TransactionBuilder.fromXDR(
        xdr,
        SERVER_URL
      );
      const response = await server.submitTransaction(transactionToSubmit);
      console.log(response);
      dispatch({ type: "SUCCESS_SUBMIT" });
    } catch {
      dispatch({ type: "CANNOT_SUBMIT" });
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
        value = "";
      }
    }
    dispatch({ type: "CHANGE_VALUE", payload: { name, value } });
  };
  const closeModal = () => {
    dispatch({ type: "CLOSE_MODAL" });
  };

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
    <>
      {isConnected() && <h1>user connected</h1>}
      {publicKey ? (
        <h1>{publicKey}</h1>
      ) : (
        <button onClick={retrievePublicKey}>login</button>
      )}

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
        {}
        {publicKey ? (
          <button type="submit">submit</button>
        ) : (
          <button onClick={retrievePublicKey}>login</button>
        )}
      </form>
    </>
  );
};

export default TransactionForm;
