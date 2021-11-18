import React from "react";
import logo from "./asset/Neptunus Text Right 1.png";

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <img src={logo} alt="logo" />
      </div>
    </nav>
  );
};

export default Navbar;
