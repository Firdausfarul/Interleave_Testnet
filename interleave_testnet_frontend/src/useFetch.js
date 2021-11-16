import { useState, useEffect } from "react";

export const useFetch = (url) => {
  const [data, setData] = useState([]);

  const getData = async () => {
    const response = await fetch(url);
    const newData = await response.json();
    setData(newData);
  };

  useEffect(() => {
    getData();
  }, [url]);
  return data;
};
