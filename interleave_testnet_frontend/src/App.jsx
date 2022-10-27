import { useReducer, useEffect, useState } from "react";
import axios from "axios";
import {
  isConnected,
  getPublicKey,
  getNetwork,
  signTransaction,
} from "@stellar/freighter-api";
import StellarSdk, { Asset } from "stellar-sdk";

import { neptunusCalculate, neptunusExecute } from "./lib/neptunus";

import { reducer } from "./reducer";
import { defaultState } from "./defaultState";

import Navbar from "./components/Navbar";
import TransactionForm from "./components/TransactionForm";
import Result from "./components/Result";

var temps;
var temps2;
var temps3;
var temps4;

const App = () => {
  const [state, dispatch] = useReducer(reducer, defaultState);
  const [averagePrice, setAveragePrice] = useState();
  const [profit, setProfit] = useState();
  const [profitXLM, setProfitXLM] = useState();
  const [resultReceive, setResultReceive] = useState();
  const [transactions, setTransactions] = useState([]);
  const {
    account,
    assetSend,
    assetReceive,
    amountSend,
    slippage,
    listTransaction,
  } = state;
  const fetchUrl = async (url) => {
    try {
      const response = await axios.get(url);
      const data = response.data;
      return data;
    } catch (e) {
      return e;
    }
  };

  const round = (num) => {
    return Math.floor(num * 10000000) / 10000000;
  };
  const submitXDR = async (url) => {
    try {
      const data = await fetchUrl(url);
      let xdr = data.xdr;
      xdr = await signTransaction(xdr, account.network);
      let SERVER_URL = "";
      if (account.network === "TESTNET") {
        SERVER_URL = `https://horizon-testnet.stellar.org`;
      } else if (account.network === "PUBLIC") {
        SERVER_URL = `https://horizon.stellar.org`;
      }
      const server = new StellarSdk.Server(SERVER_URL);
      const transactionToSubmit = StellarSdk.TransactionBuilder.fromXDR(
        xdr,
        SERVER_URL
      );
      const response = await server.submitTransaction(transactionToSubmit);
      dispatch({ type: "SUCCESS_SUBMIT_XDR" });
      const name = "listTransaction";
      const newId = response.id;
      const value = [
        ...listTransaction,
        { network: account.network.toLowerCase(), id: newId },
      ];
      dispatch({ type: "CHANGE_VALUE", payload: { name, value } });
    } catch {
      dispatch({ type: "CANNOT_SUBMIT_XDR" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (account && assetSend && assetReceive && amountSend) {
      // console.log({ assetSend, assetReceive });
      dispatch({ type: "PROCESSING_TRANSACTION" });
      let sourceAsset, destinationAsset;
      if (assetSend.code == "XLM" && assetSend.issuer == "None") {
        sourceAsset = new Asset.native();
      } else {
        sourceAsset = new Asset(assetSend.code, assetSend.issuer);
      }

      if (assetReceive.code == "XLM" && assetReceive.issuer == "None") {
        destinationAsset = new Asset.native();
      } else {
        destinationAsset = new Asset(assetReceive.code, assetReceive.issuer);
      }

      neptunusExecute(
        sourceAsset,
        destinationAsset,
        account.publicKey,
        amountSend,
        slippage
      )
        .then(async (res) => {
          console.log(res);
          try {
            let xdr = res;
            xdr = await signTransaction(xdr, account.network);
            let SERVER_URL = "";
            if (account.network === "TESTNET") {
              SERVER_URL = `https://horizon-testnet.stellar.org`;
            } else if (account.network === "PUBLIC") {
              SERVER_URL = `https://horizon.stellar.org`;
            }
            const server = new StellarSdk.Server(SERVER_URL);
            const transactionToSubmit = StellarSdk.TransactionBuilder.fromXDR(
              xdr,
              SERVER_URL
            );
            const response = await server.submitTransaction(
              transactionToSubmit
            );
            dispatch({ type: "SUCCESS_SUBMIT_XDR" });
            const name = "listTransaction";
            const newId = response.id;
            const value = [
              ...listTransaction,
              { network: account.network.toLowerCase(), id: newId },
            ];
            // setTransactions([res, ...transactions]);
            dispatch({ type: "CHANGE_VALUE", payload: { name, value } });
          } catch {
            dispatch({ type: "CANNOT_SUBMIT_XDR" });
          }
          // dispatch({ type: "SUCCESS_SUBMIT_XDR" });
        })
        .catch((err) => {
          console.log(err);
          dispatch({ type: "CANNOT_SUBMIT_XDR" });
        });
    } else if (account) {
      dispatch({ type: "NO_VALUE" });
    }
  };

  const handleChange = (e) => {
    // console.log(e);
    const name = e.current.name;
    let value = e.current.value;
    if (name === "amountSend" || name === "amountReceive") {
      // e.current.value = round(e.current.value);
      // console.log(round(e.current.value));
      value = round(e.current.value);
    }
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
    } else if (name === "assetSend" || name === "assetReceive") {
      const [balance, code, issuer] = value.split("_");
      value = { balance, code, issuer };
    }
    dispatch({ type: "CHANGE_VALUE", payload: { name, value } });
  };
  const closeNotification = () => {
    dispatch({ type: "CLOSE_NOTIFICATION" });
  };
  const loginFreighter = async () => {
    if (isConnected()) {
      let publicKey = "";
      let network = "";
      let url = "";

      try {
        publicKey = await getPublicKey();
        network = await getNetwork();
        if (network === "TESTNET") {
          url = `https://horizon-testnet.stellar.org/accounts/${publicKey}`;
        } else if (network === "PUBLIC") {
          url = `https://horizon.stellar.org/accounts/${publicKey}`;
        }

        const balances = await fetchUrl(url).then((data) => data.balances);
        let listAsset = [];
        balances.forEach((asset) => {
          if (asset.asset_type === "native") {
            listAsset.push({
              balance: asset.balance,
              code: "XLM",
              issuer: "None",
            });
          } else if (
            asset.asset_type !== "liquidity_pool_shares" &&
            asset.balance !== "0.0000001"
          ) {
            listAsset.push({
              balance: asset.balance,
              code: asset.asset_code,
              issuer: asset.asset_issuer,
            });
          }
        });

        const name = "account";
        const value = { publicKey, listAsset, network };

        dispatch({ type: "CHANGE_VALUE", payload: { name, value } });
      } catch (e) {
        dispatch({ type: "CANNOT_LOGIN" });
      }
    } else {
      dispatch({ type: "FREIGHTER_NOT_INSTALLED" });
    }
  };
  const setMaxBalance = () => {
    const name = "amountSend";
    const value = assetSend.balance;
    dispatch({ type: "CHANGE_VALUE", payload: { name, value } });
  };

  useEffect(() => {
    setAveragePrice(
      `Loading...`
    );
    setProfit(`Loading...`);
    setProfitXLM(`Loading...`);
    setResultReceive("Loading...");
    const getAmountReceive = async () => {
      // dispatch({ type: "PROCESSING_TRANSACTION" });
      let sourceAsset, destinationAsset;
      if (assetSend.code == "XLM" && assetSend.issuer == "None") {
        sourceAsset = new Asset.native();
      } else {
        sourceAsset = new Asset(assetSend.code, assetSend.issuer);
      }

      if (assetReceive.code == "XLM" && assetReceive.issuer == "None") {
        destinationAsset = new Asset.native();
      } else {
        destinationAsset = new Asset(assetReceive.code, assetReceive.issuer);
      }
      temps2=amountSend;
      temps3=sourceAsset;
      temps4=destinationAsset;

      neptunusCalculate(sourceAsset, destinationAsset, amountSend)
        .then((res) => {
          if(res.sourceAmount==temps2 && res.sourceAsset==temps3 && res.destinationAsset==temps4){
            setAveragePrice(
              `1 ${res.sourceAsset.code} = ${res.averagePrice} ${res.destinationAsset.code}`
            );
            setProfit(`${res.profit} ${res.destinationAsset.code}`);
            setProfitXLM(`${res.profitInXLM} XLM`);
            setResultReceive(round(res.destinationAmount));
          }})
        .catch((err) => console.log(err));
    };
    temps=amountSend;
    if (account && amountSend && assetSend && assetReceive && amountSend >= 0) {
      setTimeout(() => {
        if(amountSend===temps){
          getAmountReceive();
        }
      }, 1000);
      
      const interval = setInterval(() => {
        getAmountReceive();
      }, 30000);

      return () => clearInterval(interval);
    } else if (!amountSend) {
      const name = "amountReceive";
      const value = "";
      dispatch({
        type: "CHANGE_VALUE",
        payload: { name, value },
      });
    }
  }, [amountSend, assetSend, assetReceive, account]);

  return (
    <div className="bg-gray-900 min-h-screen">
      <div className="w-10/12 mx-auto">
      {account ? (
        <Navbar publicKey={account.publicKey} loginFreighter={loginFreighter} />
      ) : (
        <Navbar />
      )}
        <div className="flex flex-col space-y-5 pb-5">
          <TransactionForm
            state={state}
            handleSubmit={handleSubmit}
            handleChange={handleChange}
            loginFreighter={loginFreighter}
            closeNotification={closeNotification}
            setMaxBalance={setMaxBalance}
            resultReceive={resultReceive}
          />
          {averagePrice && profit && profitXLM && (
            <Result
              averagePrice={averagePrice}
              profit={profit}
              transactions={listTransaction}
              profitXLM={profitXLM}
            />
          )}

          <div></div>
        </div>
      </div>
    </div>
  );
};

export default App;
