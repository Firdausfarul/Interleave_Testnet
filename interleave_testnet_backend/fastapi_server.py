from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware

from interleave_path_test_rev1 import main

class XDR(BaseModel):
    xdr: str

class amount_receive(BaseModel):
    amount_receive: float

app = FastAPI()

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
            amount_send: str, slippage: float):
    
    xdr = main (
        public_key=public_key,
        asset_send_code=asset_send_code,
        asset_send_issuer=asset_send_issuer,
        asset_receive_code=asset_receive_code,
        asset_receive_issuer=asset_receive_issuer,
        amount_send=amount_send,
        slippage=slippage,
        operation_detail="fetch_xdr"
    )

    return {"xdr": xdr}

@app.get("/fetch_amount_receive", response_model=amount_receive)
def fetch_amount_receive(*, asset_send_code: str, asset_send_issuer: Optional[str] = None, 
            asset_receive_code: str, asset_receive_issuer: Optional[str] = None, amount_send: str):

    amount_receive = main (
        asset_send_code=asset_send_code,
        asset_send_issuer=asset_send_issuer,
        asset_receive_code=asset_receive_code,
        asset_receive_issuer=asset_receive_issuer,
        amount_send=amount_send,
        operation_detail="fetch_amount_receive"
    )
    
    return {"amount_receive": amount_receive}
