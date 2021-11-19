import React from "react";
import { listAsset } from "./listAsset";
import { Asset } from "./Asset";
import Notification from "./Notification";

export const TransactionFormContext = React.createContext();

const TransactionForm = (props) => {
  const {
    state,
    handleSubmit,
    handleChange,
    loginFreighter,
    closeNotification,
  } = props;
  const {
    publicKey,
    amountSend,
    amountReceive,
    slippage,
    isNotificationOpen,
    notificationContent,
    notificationColor,
  } = state;
  return (
    <section>
      <div className="section-center">
        <div className="container">
          <div className="row">
            <div className="transaction-form">
              <div className="form-header">
                <h1>Swap Asset</h1>
              </div>
              {/* {isConnected() && <h1>user connected</h1>}
              {publicKey && (
                <>
                  <h1>{publicKey}</h1>
                  <button onClick={logoutFreighter}>logout</button>
                </>
              )}*/}
              {isNotificationOpen && (
                <Notification
                  notificationColor={notificationColor}
                  notificationContent={notificationContent}
                  closeNotification={closeNotification}
                />
              )}

              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-sm-7">
                    <div className="form-group">
                      <span className="form-label">Amount Send</span>
                      <input
                        type="number"
                        step={0.0000001}
                        id="amountSend"
                        name="amountSend"
                        value={amountSend}
                        onChange={handleChange}
                        placeholder="0.0000000"
                        className="form-control"
                      />
                    </div>
                  </div>
                  <div className="col-sm-5">
                    <div className="form-group">
                      <span className="form-label">Asset Send</span>
                      <select
                        name="assetSend"
                        onChange={handleChange}
                        className="form-control"
                      >
                        <option value="">Select Asset Type</option>
                        {listAsset.map((asset) => {
                          return <Asset key={asset.code} {...asset} />;
                        })}
                      </select>
                      <span className="select-arrow"></span>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-sm-7">
                    <div className="form-group">
                      <span className="form-label">
                        Estimated Amount Receive
                      </span>
                      <input
                        type="number"
                        step={0.0000001}
                        id="amountReceive"
                        name="amountReceive"
                        value={amountReceive}
                        placeholder="Estimate From Amount Send"
                        className="form-control"
                        readOnly
                      />
                    </div>
                  </div>
                  <div className="col-sm-5">
                    <div className="form-group">
                      <span className="form-label">Asset Receive</span>
                      <select
                        name="assetReceive"
                        onChange={handleChange}
                        className="form-control"
                      >
                        <option value="">Select Asset Type</option>
                        {listAsset.map((asset) => {
                          return <Asset key={asset.code} {...asset} />;
                        })}
                      </select>
                      <span className="select-arrow"></span>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-sm-5 m-auto">
                    <div className="form-group">
                      <span className="form-label">Slippage Tolerance</span>
                      <input
                        type="number"
                        step={0.01}
                        id="slippage"
                        name="slippage"
                        value={slippage}
                        onChange={handleChange}
                        placeholder="value between 0-1 (default 0.1)"
                        max="1.00"
                        min="0.00"
                        className="form-control"
                      />
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="form-btn">
                    {publicKey ? (
                      <button type="submit" className="submit-btn">
                        submit
                      </button>
                    ) : (
                      <button onClick={loginFreighter} className="submit-btn">
                        login
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TransactionForm;
