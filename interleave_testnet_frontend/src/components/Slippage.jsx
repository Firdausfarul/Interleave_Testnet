import { useRef, useState } from "react";

const Slippage = () => {
  const buttons = [0.1, 0.5];

  const slippageRef = useRef();

  const [slippage, setSlippage] = useState(0.1);
  const [chosen, setChosen] = useState(0);

  const clickHandler = (e, index) => {
    e.preventDefault();
    setChosen(index);
    if (chosen === buttons.length) setSlippage(slippage.current.value);
    else setSlippage(buttons[buttons]);
  };
  const slippageChangeHandler = (e) => {
    clickHandler(e, buttons.length);
    if (slippageRef.current.value.length > 3)
      slippageRef.current.value = slippageRef.current.value.substr(0, 2);
  };
  const slippageTextClickHandler = (e) => {
    if (slippageRef.current.value !== "") clickHandler(e, buttons.length);
  };

  return (
    <div className="text-white flex flex-col space-y-2">
      <span className="text-sm text-center">SLIPPAGE TOLERANCE</span>
      <div className="flex space-x-2 justify-center">
        {buttons.map((button, index) => (
          <button
            className={`${
              chosen === index
                ? `bg-black hover:bg-gray-500 ring-2 ring-indigo-700`
                : `bg-gray-900 hover:bg-gray-700`
            } duration-200 px-3 py-2 rounded-md text-sm`}
            key={button}
            onClick={(e) => clickHandler(e, index)}
          >
            {button}%
          </button>
        ))}
        <div className="relative">
          <label htmlFor="slippage" className="relative">
            <span className="absolute text-sm pl-2 py-2 cursor-text">
              Custom
            </span>
            <span className="absolute right-0 pr-2 py-2 cursor-text">%</span>
            <input
              type="number"
              name="slippage"
              id="slippage"
              placeholder="0-100"
              ref={slippageRef}
              className={`${
                chosen === buttons.length
                  ? `ring-2 ring-indigo-700 bg-black`
                  : `bg-gray-900`
              } outline-none pl-16 py-2 pr-6 rounded-md duration-200 text-sm text-right w-36`}
              onClick={(e) => slippageTextClickHandler(e)}
              onChange={slippageChangeHandler}
              //   maxLength="2"
            />
          </label>
        </div>
      </div>
    </div>
  );
};

export default Slippage;
