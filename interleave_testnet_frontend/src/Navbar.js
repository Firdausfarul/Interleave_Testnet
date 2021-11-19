import React from "react";
import logo from "./asset/Neptunus Text Right 1.png";

const Navbar = ({ publicKey }) => {
  return (
    <header>
      <img src={logo} height="45" alt="" className="logo" />
      {publicKey && <button className="account">{publicKey}</button>}
    </header>
  );
};

export default Navbar;
