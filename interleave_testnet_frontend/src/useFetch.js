import { useState, useEffect } from "react";
import axios from "axios";

export const useFetch = (url) => {
  const [data, setData] = useState([]);

  const getData = async () => {
    const response = await axios.get(url);
    const data = await response.json();
    setData(data);
  };

  useEffect(() => {
    getData();
  }, [url]);
  return data;
};
