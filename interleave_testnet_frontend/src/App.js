import "./App.css";
import React from "react";
import Navbar from "./Navbar";
import Transaction from "./Transaction";

function App() {
  return (
    <React.Fragment>
      <Navbar />
      <Transaction />
    </React.Fragment>
  );
}

export default App;
