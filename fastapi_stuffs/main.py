from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware

import json
import random
import time
import base64
import math

import stellar_sdk
from stellar_sdk import Keypair,Server, TransactionBuilder, Network, Signer, Asset, xdr
import requests
from stellar_sdk import operation

server = Server("https://horizon-testnet.stellar.org")
base_fee = server.fetch_base_fee()*1000

def floor(num, dec_point):
    mul = 10**dec_point
    num_ = math.floor(num*mul)
    return float(num_/mul)

#Function for calculating amount received given the amount of asset sent
def liqpool_calc_send(amount_sent):
    balance = [0,0]
    amount_sent=floor(amount_sent*0.997, 7)
    if(main.asset_send.type != 'native'):
        asset_info = main.asset_send.code +':' + main.asset_send.issuer
    else :
        asset_info = 'native'
    balance[0]=float(main.liqpool_details['reserves'][0]['amount']) #balanceA
    balance[1]=float(main.liqpool_details['reserves'][1]['amount']) #balanceB
    pool_product=balance[0]*balance[1]
    if(main.asset_send.order == 0):
        balance_after=balance[0]+amount_sent
        z=pool_product/balance_after
        amount_received=floor((balance[1]-z), 7)
        #print((balance[1] - amount_received) * (balance[0] + amount_sent))
        return amount_received
    elif(main.asset_send.order == 1):
        balance_after=balance[1]+amount_sent
        z=pool_product/balance_after
        amount_received = floor((balance[0]-z), 7)
        #print((balance[0]-amount_received)*(balance[1]+amount_sent))
        return amount_received

#Function for calculating amount received given the amount of asset sent (for orderbook)
def orderbook_calc_send(amount_sent):
    depth=[]
    amount_received=0
    for i in range(len(main.ob_details['bids'])):
        depth.append(floor(1/float(main.ob_details['bids'][i]['price'])*float(main.ob_details['bids'][i]['amount']), 7))
        if(amount_sent>=depth[i]):
            amount_received=amount_received+float(main.ob_details['bids'][i]['amount'])
            amount_sent=amount_sent-depth[i]
            if(amount_sent==0):
                return floor(amount_received, 7)
        elif(amount_sent<depth[i]):
            amount_received=amount_received+floor((amount_sent/depth[i])*float(main.ob_details['bids'][i]['amount']), 7)
            amount_sent=0
            return floor(amount_received, 7)

def mix(i, amount_on_liqpool):
    total=liqpool_calc_send(amount_on_liqpool) + orderbook_calc_send(main.amount_sent[i]-amount_on_liqpool)
    return floor(total, 7)

#Finding the best combination of LP:Orderbook using ternary search
def best_mix_calc_send(i, amount_sent):
    accuracy = 0.0000001 #decimal accuracy
    l=0
    r=amount_sent
    while(r-l > accuracy):
        m1 = l + (r-l) / 3
        m2= r - (r-l) / 3
        f1= mix(i, m1)
        f2= mix(i, m2)
        if(f1 < f2):
            l = m1
        else:
            r = m2
    l=floor(l, 7)
    return l #returning the amount sent that should be sent to liquidity pool

def main(*, public_key = None, asset_send_code, asset_send_issuer, asset_receive_code,
         asset_receive_issuer, amount_send, slippage = 0, operation_detail):

    asset=[]
    main.amount_sent=[]
    send_amount1=[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    send_amount2=[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    dest_min1=[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    dest_min2=[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    amount_sent_on_liqpool=[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    amount_sent_on_orderbook=[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    amount_receive_lp=[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    amount_receive_ob=[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    received_interleave=[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

    if public_key != None:
        acc=Keypair.from_public_key(public_key)
        #fetching account details
        response = requests.get('https://horizon-testnet.stellar.org/accounts/'+acc.public_key)
        acc_details = response.json()
        acc_asset=acc_details['balances']
        #listing asset owned by the account
        for i in range(len(acc_details['balances'])):
            if (acc_asset[i]['asset_type'] != 'liquidity_pool_shares' and acc_asset[i]['asset_type'] != 'native'):
                asset.append(Asset(acc_asset[i]['asset_code'], acc_asset[i]['asset_issuer']))
            elif(acc_asset[i]['asset_type'] == 'native') :
                asset.append(Asset('XLM'))
    
    amount_send=floor(float(amount_send), 7)
    main.amount_sent.append(amount_send)

    # setting the asset send and asset receive
    main.asset_send = Asset(asset_send_code, asset_send_issuer)
    asset_receive = Asset(asset_receive_code, asset_receive_issuer)

    destine=[asset_receive]

    pathresp = server.strict_send_paths(
        source_asset=main.asset_send,
        source_amount=str(main.amount_sent[0]),
        destination=destine
    ).call()
    path=pathresp['_embedded']['records']
    # print(path[0]['destination_amount'])

    if operation_detail == "fetch_xdr":
        stellar_account = server.load_account(acc.public_key)
        Transaction1=TransactionBuilder(
            source_account=stellar_account,
            network_passphrase=Network.TESTNET_NETWORK_PASSPHRASE,
            base_fee=base_fee,
        ).add_text_memo('AMOGUS')

    pathAsset=path[0]['path']
    for i in range(len(pathAsset)):
        if pathAsset[i]['asset_type'] == 'native':
            continue

        if operation_detail == "fetch_xdr":
            Transaction1.append_change_trust_op(
                asset_code=pathAsset[i]['asset_code'],
                asset_issuer=pathAsset[i]['asset_issuer']
            )

    for i in range(len(pathAsset)):
        pathAsset[i]=Asset(pathAsset[i]['asset_code'], pathAsset[i]['asset_issuer'])

    pathAsset.insert(0, main.asset_send)
    pathAsset.append(asset_receive)

    total_receive = 0

    for i in range(len(pathAsset)-1):
        if (stellar_sdk.LiquidityPoolAsset.is_valid_lexicographic_order(pathAsset[i], pathAsset[i+1])):
            liqpool = stellar_sdk.LiquidityPoolAsset(pathAsset[i], pathAsset[i+1], stellar_sdk.LIQUIDITY_POOL_FEE_V18)
            pathAsset[i].order = 0
        elif (stellar_sdk.LiquidityPoolAsset.is_valid_lexicographic_order(pathAsset[i], pathAsset[i+1]) == False):
            liqpool = stellar_sdk.LiquidityPoolAsset(pathAsset[i+1], pathAsset[i], stellar_sdk.LIQUIDITY_POOL_FEE_V18)
            pathAsset[i].order = 1
        liqpool_id = liqpool.liquidity_pool_id
        response = requests.get('https://horizon-testnet.stellar.org/liquidity_pools/' + liqpool_id)
        main.liqpool_details = response.json()
        # fetching orderbook details
        main.ob_details = server.orderbook(pathAsset[i], pathAsset[i+1]).limit(100).call()

        amount_sent_on_liqpool[i] = best_mix_calc_send(i, main.amount_sent[i])
        amount_sent_on_orderbook[i] = main.amount_sent[i] - amount_sent_on_liqpool[i]
        received_interleave[i] = mix(i, amount_sent_on_liqpool[i])
        total_receive = received_interleave[i]
        
        if operation_detail == "fetch_amount_receive":
            main.amount_sent.append(total_receive*(1-slippage))
            continue

        # determining the operation order
        path_amount_liqpool = max(liqpool_calc_send(amount_sent_on_liqpool[i]), orderbook_calc_send(amount_sent_on_liqpool[i]))
        path_amount_orderbook = max(liqpool_calc_send(amount_sent_on_orderbook[i]), orderbook_calc_send(amount_sent_on_orderbook[i]))

        amount_receive_lp[i] = liqpool_calc_send(amount_sent_on_liqpool[i])
        amount_receive_ob[i] = orderbook_calc_send(amount_sent_on_orderbook[i])
        slippage = float(slippage) / 100
        slippage = floor(1 - slippage, 4)

        if (path_amount_liqpool == amount_receive_lp[i]):
            send_amount1[i] = floor(amount_sent_on_liqpool[i],7)
            dest_min1[i] = floor(amount_receive_lp[i] * slippage, 7)
            send_amount2[i] = floor(amount_sent_on_orderbook[i],7)
            dest_min2[i] = floor(amount_receive_ob[i] * slippage, 7)
        else:
            send_amount2[i] = floor(amount_sent_on_liqpool[i], 7)
            dest_min2[i] = floor(amount_receive_lp[i] * slippage, 7)
            send_amount1[i] = floor(amount_sent_on_orderbook[i], 7)
            dest_min1[i] = floor(amount_receive_ob[i] * slippage, 7)

        if(send_amount1[i]!=0):
            Transaction1.append_path_payment_strict_send_op(
                destination=acc.public_key,
                send_code=pathAsset[i].code,
                send_issuer=pathAsset[i].issuer,
                send_amount=str(send_amount1[i]),
                dest_code=pathAsset[i+1].code,
                dest_issuer=pathAsset[i+1].issuer,
                dest_min=str(dest_min1[i]),
                path=[]
            )
        if(send_amount2[i]!=0):
            Transaction1.append_path_payment_strict_send_op(
                destination=acc.public_key,
                send_code=pathAsset[i].code,
                send_issuer=pathAsset[i].issuer,
                send_amount=str(send_amount2[i]),
                dest_code=pathAsset[i+1].code,
                dest_issuer=pathAsset[i+1].issuer,
                dest_min=str(dest_min2[i]),
                path=[]
            )
        main.amount_sent.append(dest_min1[i]+dest_min2[i])
    
    if operation_detail == "fetch_amount_receive":
        return total_receive

    Transaction1=Transaction1.build().to_xdr()
    return Transaction1


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

# uncomment to check and debug

# print(fetch_xdr(
#         public_key='GCGZZQNPC3KO2LV56EN2WLOGGRCREH5T7BK6EZ6L3FQOH6W73SEZITBW', 
#         asset_send_code='TERN', 
#         asset_send_issuer='GAZDAUCRI3E7APVYGOPLLS6CMMCCXTUZ6ZKWPOS2EMOOGIGOIQWHWYTQ',
#         asset_receive_code='AQUA', 
#         asset_receive_issuer='GAZDAUCRI3E7APVYGOPLLS6CMMCCXTUZ6ZKWPOS2EMOOGIGOIQWHWYTQ',
#         amount_send='5',
#         slippage=0.01,
#     )
# )
# print(fetch_amount_receive(
#         asset_send_code='TERN', 
#         asset_send_issuer='GAZDAUCRI3E7APVYGOPLLS6CMMCCXTUZ6ZKWPOS2EMOOGIGOIQWHWYTQ',
#         asset_receive_code='AQUA', 
#         asset_receive_issuer='GAZDAUCRI3E7APVYGOPLLS6CMMCCXTUZ6ZKWPOS2EMOOGIGOIQWHWYTQ',
#         amount_send='5',
#     )
# )
