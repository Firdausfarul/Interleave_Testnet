from fastapi import Depends, FastAPI, Query
from pydantic import BaseModel
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware

from interleave_path_test_rev1 import testnet_main
from interleave_path_pubnet import pubnet_main
from split_path import split_path_main

import time

class XDR(BaseModel):
    xdr: str
    amount_receive: float
    profit: float

class amount_receive(BaseModel):
    amount_receive: float
    profit: float

app = FastAPI()

# origins = ["https://neptunus.io"]
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/fetch_xdr", response_model=XDR)
def fetch_xdr(*, public_key: str, asset_send_code: str, asset_send_issuer: Optional[str] = None, 
            asset_receive_code: str, asset_receive_issuer: Optional[str] = None, 
            amount_send: str, slippage: float,
            network_detail: str = Query(None, description='set to TESTNET/PUBLIC/SPLITPATH')):
    if network_detail == "TESTNET":
        xdr_testnet, receive_testnet, profit_testnet = testnet_main (
            public_key=public_key,
            asset_send_code=asset_send_code,
            asset_send_issuer=asset_send_issuer,
            asset_receive_code=asset_receive_code,
            asset_receive_issuer=asset_receive_issuer,
            amount_send=amount_send,
            slippage=slippage,
            operation_detail="fetch_xdr"
        )
        return {
            "xdr": xdr_testnet,
            "profit": profit_testnet,
            "amount_receive": receive_testnet
        }
    elif network_detail == "PUBLIC":
        xdr_interleave, receive_interleave, profit_interleave = pubnet_main (
            public_key=public_key,
            asset_send_code=asset_send_code,
            asset_send_issuer=asset_send_issuer,
            asset_receive_code=asset_receive_code,
            asset_receive_issuer=asset_receive_issuer,
            amount_send=amount_send,
            slippage=slippage,
            operation_detail="fetch_xdr"
        )
        
        return {
            "xdr": xdr_interleave,
            "profit": profit_interleave,
            "amount_receive": receive_interleave
        }
    elif network_detail == "SPLITPATH":
        xdr_splitpath, receive_splitpath, profit_splitpath = split_path_main (
            public_key=public_key,
            asset_send_code=asset_send_code,
            asset_send_issuer=asset_send_issuer,
            asset_receive_code=asset_receive_code,
            asset_receive_issuer=asset_receive_issuer,
            amount_send=amount_send,
            slippage=slippage,
            operation_detail="fetch_xdr"
        )
        return {
            "xdr": xdr_splitpath,
            "profit": profit_splitpath,
            "amount_receive": receive_splitpath
        }
    else:
        return {"xdr": "bruh momentod isi network_detail yang bener bang"}

@app.get("/fetch_amount_receive", response_model=amount_receive)
def fetch_amount_receive(*, asset_send_code: str, asset_send_issuer: Optional[str] = None, 
            asset_receive_code: str, asset_receive_issuer: Optional[str] = None, 
            amount_send: str,
            network_detail: str = Query(None, description='set to TESTNET/PUBLIC/SPLITPATH')):
    if network_detail == "TESTNET":
        amount_receive, profit = testnet_main (
            asset_send_code=asset_send_code,
            asset_send_issuer=asset_send_issuer,
            asset_receive_code=asset_receive_code,
            asset_receive_issuer=asset_receive_issuer,
            amount_send=amount_send,
            operation_detail="fetch_amount_receive"
        )
        return {"amount_receive": amount_receive, "profit": profit}
    elif network_detail == "PUBLIC":
        amount_receive, profit = pubnet_main (
            asset_send_code=asset_send_code,
            asset_send_issuer=asset_send_issuer,
            asset_receive_code=asset_receive_code,
            asset_receive_issuer=asset_receive_issuer,
            amount_send=amount_send,
            operation_detail="fetch_amount_receive"
        )
        return {"amount_receive": amount_receive, "profit": profit}
    elif network_detail == "SPLITPATH":
        amount_receive, profit = split_path_main (
            asset_send_code=asset_send_code,
            asset_send_issuer=asset_send_issuer,
            asset_receive_code=asset_receive_code,
            asset_receive_issuer=asset_receive_issuer,
            amount_send=amount_send,
            operation_detail="fetch_amount_receive"
        )
        return {"amount_receive": amount_receive, "profit": profit}
    else:
        return {"amount_receive": -69696969, "profit": -69}
    

# uncomment to check and debug
# t = time.time()

# print(fetch_xdr(
#         public_key='GDFXG6L5CDM7U3QS5U7ANC2QNSSO3QE7ZMHXWG6GTSBD4WTSALDCOVLI', 
#         asset_send_code='LSP', 
#         asset_send_issuer='GAB7STHVD5BDH3EEYXPI3OM7PCS4V443PYB5FNT6CFGJVPDLMKDM24WK',
#         asset_receive_code='XLM', 
#         asset_receive_issuer=None,
#         amount_send='177500',
#         slippage=0.01,
#         network_detail="SPLITPATH"
#     )
# )
# print(fetch_amount_receive(
#         asset_send_code='LSP', 
#         asset_send_issuer='GAB7STHVD5BDH3EEYXPI3OM7PCS4V443PYB5FNT6CFGJVPDLMKDM24WK',
#         asset_receive_code='XLM', 
#         asset_receive_issuer=None,
#         amount_send='12500',
#         network_detail="PUBLIC"
#     )
# )
# print(fetch_amount_receive(
#         asset_send_code='AQUA', 
#         asset_send_issuer='GAZDAUCRI3E7APVYGOPLLS6CMMCCXTUZ6ZKWPOS2EMOOGIGOIQWHWYTQ',
#         asset_receive_code='USDC', 
#         asset_receive_issuer='GAZDAUCRI3E7APVYGOPLLS6CMMCCXTUZ6ZKWPOS2EMOOGIGOIQWHWYTQ',
#         amount_send='5666',
#         network_detail="TESTNET"
#     )
# )
# print(fetch_xdr(
#         public_key='GAZDAUCRI3E7APVYGOPLLS6CMMCCXTUZ6ZKWPOS2EMOOGIGOIQWHWYTQ',
#         asset_send_code='AQUA', 
#         asset_send_issuer='GAZDAUCRI3E7APVYGOPLLS6CMMCCXTUZ6ZKWPOS2EMOOGIGOIQWHWYTQ',
#         asset_receive_code='USDC', 
#         asset_receive_issuer='GAZDAUCRI3E7APVYGOPLLS6CMMCCXTUZ6ZKWPOS2EMOOGIGOIQWHWYTQ',
#         amount_send='5666',
#         slippage=0.01,
#         network_detail="TESTNET"
#     )
# )
# print(f"Elapsed: {time.time()-t}")