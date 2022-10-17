import { useReducer } from "react";
import {
  isConnected,
  getPublicKey,
  getNetwork,
  signTransaction,
} from "@stellar/freighter-api";
import fetchUrl from "./fetchUrl";

const loginFreighter = async (dispatch) => {
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

export default loginFreighter;
