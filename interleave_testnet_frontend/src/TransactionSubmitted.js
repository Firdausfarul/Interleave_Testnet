import React from "react";

const TransactionSubmitted = ({ transactionId }) => {
  return (
    <li>
      sucessfully transaction with id{" "}
      <a
        href={`https://stellar.expert/explorer/testnet/tx/${transactionId}`}
        rel="noopener noreferrer"
        target="_blank"
      >
        {transactionId}
      </a>
    </li>
  );
};

export default TransactionSubmitted;
