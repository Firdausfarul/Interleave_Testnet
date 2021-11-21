import React from "react";
import logo from "./asset/Neptunus Text Right 1.png";

const Navbar = (props) => {
  const { publicKey, network, loginFreighter } = props;
  return (
    <header>
      <img src={logo} height="45" alt="" className="logo" />
      {publicKey && (
        <div className="account">
          <a
            href={`https://stellar.expert/explorer/${network}/account/${publicKey}`}
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
