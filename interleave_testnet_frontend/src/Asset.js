import React from "react";

export const Asset = (asset) => {
  return (
    <>
      <option value={`${asset.balance}_${asset.code}_${asset.issuer}`}>
        {asset.code}
      </option>
    </>
  );
};
