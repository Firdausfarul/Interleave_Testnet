import React from "react";

const Asset = (asset) => {
  return (
    <>
      <option value={`${asset.code}_${asset.issuer}`}>{asset.code}</option>
    </>
  );
};

export default Asset;
