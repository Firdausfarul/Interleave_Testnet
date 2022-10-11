import Navbar from "./components/Navbar";
import TransactionForm from "./components/TransactionForm";
import Result from "./components/Result";

const App = () => {
  return (
    <div className="bg-gray-900 min-h-screen">
      <div className="w-10/12 mx-auto">
        <Navbar />
        <div className="flex flex-col space-y-5 pb-5">
          <TransactionForm />
          <Result />
          <div></div>
        </div>
      </div>
    </div>
  );
};

export default App;
