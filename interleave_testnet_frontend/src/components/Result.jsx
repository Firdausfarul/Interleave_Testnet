const Result = ({ averagePrice, profit, profitXLM, transactions }) => {
  const results = [
    {
      name: "Average Price",
      value: averagePrice,
    },
    {
      name: "Profit",
      value: profit,
    },
    {
      name: "Profit in XLM",
      value: profitXLM,
    },
  ];

  return (
    <div className="w-full md:w-8/12 mx-auto bg-gray-800 py-10 px-8 md:px-16 rounded-lg shadow-lg border-4 border-gray-700">
      <div className="flex flex-col space-y-5 divide-y-2 divide-gray-700">
        {transactions.length > 0 && (
          <div className="flex flex-col space-y-2">
            {transactions.map(({ id: transaction }) => (
              <div className="flex justify-between" key={transaction}>
                <p className="text-white">Transaction success</p>
                <a
                  className="text-indigo-600 hover:text-indigo-700 transition duration-200 max-w-sm truncate"
                  href={`https://stellar.expert/explorer/public/tx/${transaction}`}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {transaction}
                </a>
              </div>
            ))}
          </div>
        )}
        <div className="flex flex-col space-y-2 pt-2">
          <div className="flex justify-between">
            <p className="text-gray-400">Average Price</p>
            <p className="text-white text-right">{averagePrice}</p>
          </div>
          <div className="flex justify-between">
            <p className="text-green-300">Profit</p>
            <p className="text-green-300 text-right">{profit}</p>
          </div>
          <div className="flex justify-between">
            <p className="text-green-300">Profit in XLM</p>
            <p className="text-green-300 text-right">{profitXLM}</p>
          </div>
          {/* {results.map((result) => (
            <div className="flex justify-between" key={result.name}>
              <p className="text-gray-400">{result.name}</p>
              <p className="text-white text-right">{result.value}</p>
            </div>
          ))} */}
        </div>
      </div>
    </div>
  );
};

export default Result;
