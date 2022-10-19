const Result = ({ averagePrice, profit, profitXLM }) => {
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
      <div className="flex flex-col space-y-5">
        {results.map((result) => (
          <div className="flex justify-between" key={result.name}>
            <p className="text-gray-400">{result.name}</p>
            <p className="text-white text-right">{result.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Result;
