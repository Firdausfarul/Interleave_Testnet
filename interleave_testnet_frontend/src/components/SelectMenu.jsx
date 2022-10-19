import { Fragment, useEffect, useRef, useState } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import _ from "lodash";

const avatars = [
  {
    code: "Select Asset",
    avatar: "none.png",
  },
  {
    name: "TERN",
    avatar: "tern.png",
  },
  {
    name: "XLM",
    avatar: "xlm.png",
  },
  {
    name: "LSP",
    avatar: "lsp.png",
  },
  {
    name: "USDC",
    avatar: "usdc.png",
  },
  {
    name: "LETH",
    avatar: "leth.png",
  },
  {
    name: "LBTC",
    avatar: "lbtc.png",
  },
  {
    name: "LSOL",
    avatar: "lsol.png",
  },
  {
    name: "NLSP",
    avatar: "nlsp.png",
  },
  {
    name: "CNY",
    avatar: "cny.png",
  },
  {
    name: "ARS",
    avatar: "ars.png",
  },
  {
    name: "BRL",
    avatar: "brl.png",
  },
  {
    name: "NGNT",
    avatar: "ngnt.png",
  },
  {
    name: "USD",
    avatar: "usd.png",
  },
  {
    name: "EURT",
    avatar: "eurt.png",
  },
  {
    name: "SLT",
    avatar: "slt.jpg",
  },
  {
    name: "RMT",
    avatar: "rmt.png",
  },
  {
    name: "UNBNK",
    avatar: "unbnk.png",
  },
  {
    name: "USDS",
    avatar: "usds.png",
  },
  {
    name: "SHX",
    avatar: "shx.png",
  },
  {
    name: "ANSR",
    avatar: "ansr.png",
  },
  {
    name: "PEN",
    avatar: "pen.png",
  },
  {
    name: "NUNA",
    avatar: "nuna.png",
  },
  {
    name: "AQUA",
    avatar: "aqua.png",
  },
  {
    name: "YBX",
    avatar: "ybx.png",
  },
  {
    name: "RBT",
    avatar: "rbt.png",
  },
  {
    name: "DRIFT",
    avatar: "drift.jpg",
  },
  {
    name: "MOBI",
    avatar: "mobi.png",
  },
  {
    name: "BRAVE",
    avatar: "brave.png",
  },
  {
    name: "BRC",
    avatar: "brc.png",
  },
  {
    name: "Diclnu",
    avatar: "DicInu.webp",
  },
];

const classNames = (...classes) => {
  return classes.filter(Boolean).join(" ");
};

const SelectMenu = ({ listAsset, assetReceive, name, onChange }) => {
  const valueRef = useRef();

  const [selected, setSelected] = useState({
    ...avatars[0],
    balance: 0,
    issuer: 0,
  });
  useEffect(() => onChange(valueRef), [selected]);

  return (
    <>
      <Listbox value={selected} onChange={setSelected}>
        {({ open }) => (
          <div className="relative w-1/3">
            <Listbox.Button className="relative w-full h-full cursor-default rounded-r-lg border-gray-500 bg-gray-900 py-2 pl-3 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm text-white">
              <span className="flex items-center">
                <img
                  src={`/currencies/${selected.avatar}`}
                  alt=""
                  className="h-6 w-6 flex-shrink-0 rounded-full"
                />
                <span className="ml-3 block truncate">{selected.code}</span>
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-2">
                <ChevronUpDownIcon
                  className="h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
              </span>
            </Listbox.Button>

            <Transition
              show={open}
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-black py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                {listAsset.map((asset) => {
                  if (
                    (assetReceive && !_.isEqual(asset, assetReceive)) ||
                    !assetReceive
                  ) {
                    return (
                      <Listbox.Option
                        key={`${asset.code}_${asset.issuer}`}
                        className={({ active }) =>
                          classNames(
                            active ? "text-white bg-indigo-600" : "text-white",
                            "relative cursor-default select-none py-2 pl-3 pr-9"
                          )
                        }
                        value={{
                          ...asset,
                          avatar:
                            avatars.find((av) => av.name == asset.code)
                              ?.avatar ?? avatars[0].avatar,
                        }}
                      >
                        {({ selected, active }) => (
                          <>
                            <div className="flex items-center">
                              <img
                                src={`/currencies/${
                                  avatars.find((av) => av.name == asset.code)
                                    ?.avatar ?? avatars[0].avatar
                                }`}
                                alt=""
                                className="h-6 w-6 flex-shrink-0 rounded-full"
                              />
                              <span
                                className={classNames(
                                  selected ? "font-semibold" : "font-normal",
                                  "ml-3 block truncate"
                                )}
                              >
                                {asset.code}
                              </span>
                            </div>

                            {selected ? (
                              <span
                                className={classNames(
                                  active ? "text-white" : "text-indigo-600",
                                  "absolute inset-y-0 right-0 flex items-center pr-4"
                                )}
                              >
                                <CheckIcon
                                  className="h-5 w-5"
                                  aria-hidden="true"
                                />
                              </span>
                            ) : null}
                          </>
                        )}
                      </Listbox.Option>
                    );
                  }
                })}
              </Listbox.Options>
            </Transition>
          </div>
        )}
      </Listbox>
      <input
        type="hidden"
        name={name}
        value={`${selected.balance}_${selected.code}_${selected.issuer}`}
        onChange={onChange}
        ref={valueRef}
      />
    </>
  );
};

export default SelectMenu;
