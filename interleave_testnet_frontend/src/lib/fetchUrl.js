import axios from "axios";

const fetchUrl = async (url) => {
  try {
    const response = await axios.get(url);
    const data = response.data;
    return data;
  } catch (e) {
    return e;
  }
};

export default fetchUrl;
