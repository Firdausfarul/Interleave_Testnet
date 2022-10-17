import { useEffect, useRef, useState } from "react";

const Slippage = ({ slippage: defaultSlippage, onChange }) => {
  const buttons = [0.1, 0.5];

  const slippageRef = useRef();
  const valueRef = useRef();

  const [slippage, setSlippage] = useState(0.1);
  const [chosen, setChosen] = useState(0);

  useEffect(() => onChange(valueRef), [slippage]);
  const clickHandler = (e, index) => {
    e.preventDefault();
    setChosen(index);
    if (index === buttons.length) setSlippage(slippageRef.current.value);
    else setSlippage(buttons[index]);
  };
  const changeHandler = (e) => {
    setSlippage(slippageRef.current.value);
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
              placeholder="0-100"
              ref={slippageRef}
              className={`${
                chosen === buttons.length
                  ? `ring-2 ring-indigo-700 bg-black`
                  : `bg-gray-900`
              } outline-none pl-16 py-2 pr-6 rounded-md duration-200 text-sm text-right w-36`}
              onClick={(e) => clickHandler(e, buttons.length)}
              onChange={changeHandler}
            />
            <input
              type="hidden"
              id="slippage"
              name="slippage"
              ref={valueRef}
              value={slippage}
            />
          </label>
        </div>
      </div>
    </div>
  );
};

export default Slippage;
