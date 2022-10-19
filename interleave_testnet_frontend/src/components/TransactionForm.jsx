import SelectMenu from "./SelectMenu";
import Slippage from "./Slippage";
import Notification from "./Notification";
import { useRef } from "react";

const TransactionForm = (props) => {
  const assetSendRef = useRef();
  const assetReceiveRef = useRef();
  const {
    state,
    handleSubmit,
    handleChange,
    loginFreighter,
    closeNotification,
    setMaxBalance,
    resultReceive,
  } = props;
  const {
    account,
    amountSend,
    amountReceive,
    assetSend,
    assetReceive,
    slippage,
    isNotificationOpen,
    notificationContent,
    notificationColor,
    isSubmitting,
    listTransaction,
  } = state;
  return (
    <div className="w-full md:w-8/12 mx-auto bg-gray-800 py-10 px-8 md:px-16 rounded-lg shadow-lg border-4 border-gray-700">
      <h2 className="font-bold text-white text-2xl text-center">SWAP ASSETS</h2>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col space-y-5">
        {isNotificationOpen && (
          <Notification
            notificationColor={notificationColor}
            notificationContent={notificationContent}
            closeNotification={closeNotification}
          />
        )}
        <div className="flex flex-col space-y-2">
          <div className="flex space-x-1">
            <label
              htmlFor="amount"
              className="relative block text-white flex-grow"
            >
              <span className="absolute text-xs pl-2 pt-2 cursor-text truncate">
                AMOUND SEND
              </span>
              <input
                type="number"
                step={0.0000001}
                id="amountSend"
                name="amountSend"
                value={amountSend}
                ref={assetSendRef}
                onChange={() => handleChange(assetSendRef)}
                min="0"
                placeholder="0.0000000"
                className=" outline-none px-2 pt-4 pb-2 bg-gray-900 rounded-l-lg text-lg focus:bg-black focus:ring-2 focus:ring-blue-800 duration-200 w-full"
              />
            </label>
            <SelectMenu
              listAsset={account ? account.listAsset : []}
              name="assetSend"
              onChange={handleChange}
              assetReceive={assetReceive}
            />
          </div>
          {assetSend && account && assetSend.code !== "Select Asset" && (
            <div className="flex space-x-5 justify-between">
              <span className="text-sm text-gray-300">
                Balances:{" "}
                <span
                  className=" text-indigo-600 hover:text-indigo-700 transition duration-200 cursor-pointer"
                  onClick={setMaxBalance}
                >
                  {`${assetSend.balance} ${assetSend.code}`}
                </span>
              </span>
              <a
                className="text-indigo-600 hover:text-indigo-700 transition duration-200 w-32 text-sm truncate text-right"
                rel="noopener noreferrer"
                target="_blank"
                href={
                  assetSend.code == "XLM"
                    ? `https://stellar.expert/explorer/public/asset/XLM`
                    : `https://stellar.expert/explorer/public/asset/${assetSend.code}-${assetSend.issuer}`
                }
              >
                {assetSend.code == "XLM"
                  ? `XLM`
                  : `${assetSend.code}-${assetSend.issuer}`}
              </a>
            </div>
          )}
        </div>
        <div className="flex flex-col space-y-2">
          <div className="flex space-x-1">
            <label
              htmlFor="recieved"
              className="relative block text-white flex-grow"
            >
              <span className="absolute text-xs pl-2 pt-2 cursor-default truncate">
                ESTIMATED AMOUNT RECEIVED
              </span>
              <input
                type="number"
                step={0.0000001}
                id="amountReceive"
                name="amountReceive"
                value={resultReceive}
                ref={assetReceiveRef}
                onChange={() => handleChange(assetReceiveRef)}
                readOnly
                placeholder="0.0000000"
                className=" outline-none px-2 pt-4 pb-2 bg-gray-900 rounded-l-lg text-lg focus:bg-black focus:ring-2 focus:ring-blue-800 duration-200 w-full cursor-default"
              />
            </label>
            <SelectMenu
              listAsset={account ? account.listAsset : []}
              name="assetReceive"
              onChange={handleChange}
              assetReceive={assetReceive}
            />
          </div>
          {assetReceive && account && assetReceive.code !== "Select Asset" && (
            <div className="flex space-x-5 justify-between">
              <span className="text-sm text-gray-300">
                Balances:{" "}
                <span className=" text-indigo-600">
                  {`${assetReceive.balance} ${assetReceive.code}`}
                </span>
              </span>
              <a
                className="text-indigo-600 hover:text-indigo-700 transition duration-200 w-32 text-sm truncate text-right"
                rel="noopener noreferrer"
                target="_blank"
                href={
                  assetReceive.code == "XLM"
                    ? `https://stellar.expert/explorer/public/asset/XLM`
                    : `https://stellar.expert/explorer/public/asset/${assetReceive.code}-${assetReceive.issuer}`
                }
              >
                {assetReceive.code == "XLM"
                  ? `XLM`
                  : `${assetReceive.code}-${assetReceive.issuer}`}
              </a>
            </div>
          )}
        </div>
        <Slippage slippage={slippage} onChange={handleChange} />
        <input
          type="submit"
          value={
            account
              ? isSubmitting
                ? `Submitting...`
                : `Submit`
              : `Login With Freighter`
          }
          onClick={!account ? loginFreighter : undefined}
          className=" bg-indigo-700 hover:bg-indigo-800 duration-200 text-white rounded-lg py-3 focus:ring-2 focus:ring-blue-800 font-bold"
        />
      </form>
    </div>
  );
};

export default TransactionForm;
