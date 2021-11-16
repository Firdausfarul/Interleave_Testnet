import React from "react";
import logo from "./asset/Neptunus Text Right 1.png";

const Navbar = () => {
  return (
    <nav class="navbar">
      <div class="navbar-logo">
        <a href="#">
          <img src={logo} alt="logo" />
        </a>
      </div>
    </nav>
  );
};

export default Navbar;
