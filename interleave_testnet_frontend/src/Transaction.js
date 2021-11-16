import React, { useReducer } from "react";
import Modal from "./Modal";
import { useFetch } from "./useFetch";
import { listAsset } from "./listAsset";
import Asset from "./Asset";
const reducer = (state, action) => {
  const {
    account,
    assetSend,
    assetReceive,
    amountSend,
    amountReceive,
    slippage,
    xdr,
    isModalOpen,
    modalContent,
  } = state;
  if (action.type === "FETCH_XDR") {
  } else if (action.type === "SUBMIT_XDR") {
  } else if (action.type === "NO_VALUE") {
  } else if (action.type === "CLOSE_MODAL") {
  }
};

const defaultState = {
  account: "",
  assetSend: { code: "", issuer: "", website: "", logo: "" },
  assetReceive: { code: "", issuer: "", website: "", logo: "" },
  amountSend: 0.0,
  amountReceive: 0.0,
  slippage: 0.0,
  xdr: "",
  isModalOpen: false,
  modalContent: "",
};

const Transaction = () => {
  const [state, dispatch] = useReducer(reducer, defaultState);
  const {
    account,
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
    if (amountSend && !xdr) {
      dispatch({ type: "FETCH_XDR" });
    } else if (amountSend && slippage && xdr) {
      dispatch({ type: "SUBMIT_XDR" });
    } else {
      dispatch({ type: "NO_VALUE" });
    }
  };
  const closeModal = () => {
    dispatch({ type: "CLOSE_MODAL" });
  };

  return (
    <>
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
          />
        </div>
        <div className="form-control">
          <select name="assetSend">
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
            readOnly
          />
        </div>
        <div className="form-control">
          <select name="assetReceive">
            {listAsset.map((asset) => {
              return <Asset key={asset.code} {...asset} />;
            })}
          </select>
        </div>
        <div className="form-control">
          <label htmlFor="slippage">Slippage : </label>
          <input
            type="number"
            step={0.0000001}
            id="amountSend"
            name="amountSend"
            value={amountSend}
            onChange={handleChange}
          />
        </div>
      </form>
    </>
  );
};

export default Transaction;
