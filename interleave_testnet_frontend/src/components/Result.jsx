const Result = () => {
  const results = [
    {
      name: "Source Asset",
      value: "5,345.4127 USDC",
    },
    {
      name: "Source Amount",
      value: "5,345.4127 USDC",
    },
    {
      name: "Destination Asset",
      value: "5,345.4127 USDC",
    },
    {
      name: "Average Price",
      value: "5,345.4127 USDC",
    },
    {
      name: "Profit",
      value: "5,345.4127 LETH",
    },
    {
      name: "Profit in XLM",
      value: "5,345.4127 XLM",
    },
  ];

  return (
    <div className="w-full md:w-8/12 mx-auto bg-gray-800 py-10 px-8 md:px-16 rounded-lg shadow-lg border-4 border-gray-700">
      <div className="flex flex-col space-y-5">
        {results.map((result) => (
          <div className="flex justify-between" key={result.name}>
            <p className="text-gray-400">{result.name}</p>
            <p className="text-white">{result.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Result;
