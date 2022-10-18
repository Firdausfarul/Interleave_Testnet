import { signTransaction } from "@stellar/freighter-api";
import StellarSdk from "stellar-sdk";
import fetchUrl from "./fetchUrl";

const submitXDR = async (url, account, listTransaction) => {
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
