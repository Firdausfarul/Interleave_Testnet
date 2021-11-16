import React from "react";

const Asset = (asset) => {
  return (
    <option value={asset}>
      <img src={asset.logo} alt="" />
      {asset.code}
      <a href={asset.website}></a>
    </option>
  );
};

export default Asset;
