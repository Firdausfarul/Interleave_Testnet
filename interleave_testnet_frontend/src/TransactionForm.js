import React from "react";
import _ from "lodash";
import { Asset } from "./Asset";
import TransactionSubmitted from "./TransactionSubmitted";
import Notification from "./Notification";

const TransactionForm = (props) => {
  const {
    state,
    handleSubmit,
    handleChange,
    loginFreighter,
    closeNotification,
    setMaxBalance,
  } = props;
  const {
    account,
    amountSend,
    amountReceive,
    assetSend,
    assetReceive,
    slippage,
    isNotificationOpen,
    notificationContent,
    notificationColor,
    isSubmitting,
    listTransaction,
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
                        min="0"
                        className="form-control"
                      />
                      {assetSend && (
                        <span className="form-label balance">
                          Balances:{" "}
                          <span
                            className="amount"
                            onClick={setMaxBalance}
                            name="balance-send"
                          >
                            {assetSend.balance}
                          </span>{" "}
                          {assetSend.code}
                        </span>
                      )}
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

                        {account &&
                          account.listAsset.map((asset) => {
                            if (
                              (assetReceive &&
                                !_.isEqual(asset, assetReceive)) ||
                              !assetReceive
                            ) {
                              return (
                                <Asset
                                  key={`${asset.code}_${asset.issuer}`}
                                  {...asset}
                                />
                              );
                            } else {
                              return (
                                <React.Fragment key={"none"}> </React.Fragment>
                              );
                            }
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
                      {assetReceive && (
                        <span className="form-label balance">
                          Balances:{" "}
                          <span className="amount">{assetReceive.balance}</span>{" "}
                          {assetReceive.code}
                        </span>
                      )}
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
                        {account &&
                          account.listAsset.map((asset) => {
                            if (
                              (assetSend && !_.isEqual(assetSend, asset)) ||
                              !assetSend
                            ) {
                              return (
                                <Asset
                                  key={`${asset.code}_${asset.issuer}`}
                                  {...asset}
                                />
                              );
                            } else {
                              return (
                                <React.Fragment key={"none"}> </React.Fragment>
                              );
                            }
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
                        placeholder="value between 0%-100% (default 0.01%)"
                        max="100.00"
                        min="0.00"
                        className="form-control"
                      />
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="form-btn">
                    {account ? (
                      isSubmitting ? (
                        <button
                          type="submit"
                          className="submit-btn"
                          disabled
                          style={{ backgroundColor: "rgb(5, 1, 255, 0.8)" }}
                        >
                          Submitting.....
                        </button>
                      ) : (
                        <button type="submit" className="submit-btn">
                          Submit
                        </button>
                      )
                    ) : (
                      <button onClick={loginFreighter} className="submit-btn">
                        Login With Freighter
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>

          {listTransaction.length >= 1 && (
            <div className="row">
              <div className="list-transaction">
                <div className="list-transaction-header">
                  List Transaction Submitted
                </div>
                <div className="list-transaction-body">
                  <ul>
                    {listTransaction.map((transaction) => {
                      return (
                        <TransactionSubmitted
                          key={transaction.id}
                          transaction={transaction}
                        />
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default TransactionForm;
