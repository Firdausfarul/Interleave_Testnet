import "./App.css";
import React from "react";
import Navbar from "./Navbar";
import TransactionForm from "./TransactionForm";

function App() {
  return (
    <React.Fragment>
      <Navbar />
      <TransactionForm />
    </React.Fragment>
  );
}

export default App;
