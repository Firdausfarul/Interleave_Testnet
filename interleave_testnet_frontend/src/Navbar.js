import React from "react";
import logo from "./asset/Neptunus Text Right 1.png";

const Navbar = (props) => {
  let publicKey = null;
  let loginFreighter = null;
  if (props) {
    publicKey = props.publicKey;
    loginFreighter = props.loginFreighter;
  }
  return (
    <header>
      <img src={logo} height="45" alt="" className="logo" />
      {publicKey && (
        <div className="account">
          <a
            href={`https://stellar.expert/explorer/testnet/account/${publicKey}`}
            target="_blank"
            className="public-key"
            rel="noopener noreferrer"
          >
            {publicKey}
          </a>
          <button onClick={loginFreighter} className="refresh">
            Refresh Account
          </button>
        </div>
      )}
    </header>
  );
};

export default Navbar;
