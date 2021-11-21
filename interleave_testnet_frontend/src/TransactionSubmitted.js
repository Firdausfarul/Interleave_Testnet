import React from "react";

const TransactionSubmitted = ({ transaction }) => {
  return (
    <li>
      sucessfully transaction with id{" "}
      <a
        href={`https://stellar.expert/explorer/${transaction.network}/tx/${transaction.id}`}
        rel="noopener noreferrer"
        target="_blank"
      >
        {transaction.id}
      </a>
    </li>
  );
};

export default TransactionSubmitted;
