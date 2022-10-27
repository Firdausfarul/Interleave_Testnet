import { ArrowPathIcon } from "@heroicons/react/20/solid";
import logo from "../asset/Neptunus Text Right 1.png";

const Navbar = (props) => {
  let publicKey = null;
  let loginFreighter = null;
  if (props) {
    publicKey = props.publicKey;
    loginFreighter = props.loginFreighter;
  }
  return (
    <div className="flex items-center md:justify-between flex-col md:flex-row w-full md:w-11/12 mx-auto py-5 gap-10">
      <img
        src={logo}
        alt=""
        className=" md:h-10 max-w-xs aspect-auto object-center"
      />
      {publicKey && (
        <div className="flex space-x-2 items-center">
          <a
            href={`https://stellar.expert/explorer/public/account/${publicKey}`}
            target="_blank"
            rel="noopener noreferrer"
            className=" bg-gray-800 hover:bg-gray-700 text-gray-100 hover:text-white duration-200 px-3 py-2 text-xs rounded-lg w-48 truncate"
          >
            {publicKey}
          </a>
          <button onClick={loginFreighter}>
            <ArrowPathIcon
              className="h-6 w-6 text-gray-100 hover:text-white duration-200 hover:scale-125 hover:rotate-180 transform"
              aria-hidden="true"
            />
          </button>
        </div>
      )}
    </div>
  );
};
export default Navbar;
