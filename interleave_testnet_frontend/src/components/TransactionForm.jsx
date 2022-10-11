import SelectMenu from "./SelectMenu";
import Slippage from "./Slippage";
import Notification from "./Notification";

const TransactionForm = () => {
  return (
    <div className="w-full md:w-8/12 mx-auto bg-gray-800 py-10 px-8 md:px-16 rounded-lg shadow-lg border-4 border-gray-700">
      <h2 className="font-bold text-white text-2xl text-center">SWAP ASSETS</h2>
      <form action="#" className="mt-4 flex flex-col space-y-5">
        <Notification />
        <div className="flex space-x-1">
          <label
            htmlFor="amount"
            className="relative block text-white flex-grow"
          >
            <span className="absolute text-xs pl-2 pt-2 cursor-text">
              AMOUND SEND
            </span>
            <input
              type="number"
              name="amount"
              id="amount"
              placeholder="0.0000000"
              className=" outline-none px-2 pt-4 pb-2 bg-gray-900 rounded-l-lg text-lg focus:bg-black focus:ring-2 focus:ring-blue-800 duration-200 w-full"
            />
          </label>
          <SelectMenu />
        </div>
        <div className="flex space-x-1">
          <label
            htmlFor="recieved"
            className="relative block text-white flex-grow"
          >
            <span className="absolute text-xs pl-2 pt-2 cursor-default">
              ESTIMATED AMOUNT RECEIVED
            </span>
            <input
              type="number"
              name="recieved"
              id="recieved"
              readOnly
              placeholder="0.0000000"
              className=" outline-none px-2 pt-4 pb-2 bg-gray-900 rounded-l-lg text-lg focus:bg-black focus:ring-2 focus:ring-blue-800 duration-200 w-full cursor-default"
            />
          </label>
          <SelectMenu />
        </div>
        <Slippage />
        <input
          type="submit"
          value="LOGIN WITH FREIGHTER"
          className=" bg-indigo-700 hover:bg-indigo-800 duration-200 text-white rounded-lg py-3 focus:ring-2 focus:ring-blue-800 font-bold"
        />
      </form>
    </div>
  );
};

export default TransactionForm;
