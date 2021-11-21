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
def liqpool_calc_send(i, amount_sent):
    balance = [0,0]
    amount_sent=floor(amount_sent*0.997, 7)
    if(testnet_main.asset_send.type != 'native'):
        asset_info = testnet_main.asset_send.code +':' + testnet_main.asset_send.issuer
    else :
        asset_info = 'native'
    balance[0]=float(testnet_main.liqpool_details['reserves'][0]['amount']) #balanceA
    balance[1]=float(testnet_main.liqpool_details['reserves'][1]['amount']) #balanceB
    pool_product=balance[0]*balance[1]
    if(testnet_main.pathAsset[i].order == 0):
        balance_after=balance[0]+amount_sent
        z=pool_product/balance_after
        amount_received=floor((balance[1]-z), 7)
        #print((balance[1] - amount_received) * (balance[0] + amount_sent))
        return amount_received
    elif(testnet_main.pathAsset[i].order == 1):
        balance_after=balance[1]+amount_sent
        z=pool_product/balance_after
        amount_received = floor((balance[0]-z), 7)
        #print((balance[0]-amount_received)*(balance[1]+amount_sent))
        return amount_received

#Function for calculating amount received given the amount of asset sent (for orderbook)
def orderbook_calc_send(amount_sent):
    depth=[]
    amount_received=0
    for i in range(len(testnet_main.ob_details['bids'])):
        depth.append(floor(1/float(testnet_main.ob_details['bids'][i]['price'])*float(testnet_main.ob_details['bids'][i]['amount']), 7))
        if(amount_sent>=depth[i]):
            amount_received=amount_received+float(testnet_main.ob_details['bids'][i]['amount'])
            amount_sent=amount_sent-depth[i]
            if(amount_sent==0):
                return floor(amount_received, 7)
        elif(amount_sent<depth[i]):
            amount_received=amount_received+floor((amount_sent/depth[i])*float(testnet_main.ob_details['bids'][i]['amount']), 7)
            amount_sent=0
            return floor(amount_received, 7)

def mix(i, amount_on_liqpool):
    total=liqpool_calc_send(i, amount_on_liqpool) + orderbook_calc_send(testnet_main.amount_sent[i]-amount_on_liqpool)
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

def testnet_main(*, public_key = None, asset_send_code, asset_send_issuer, asset_receive_code,
         asset_receive_issuer, amount_send, slippage = 0, operation_detail):

    asset=[]
    testnet_main.amount_sent=[]
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
    testnet_main.amount_sent.append(amount_send)

    # setting the asset send and asset receive
    testnet_main.asset_send = Asset(asset_send_code, asset_send_issuer)
    asset_receive = Asset(asset_receive_code, asset_receive_issuer)

    destine=[asset_receive]

    pathresp = server.strict_send_paths(
        source_asset=testnet_main.asset_send,
        source_amount=str(testnet_main.amount_sent[0]),
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

    testnet_main.pathAsset=path[0]['path']
    for i in range(len(testnet_main.pathAsset)):
        if testnet_main.pathAsset[i]['asset_type'] == 'native':
            continue

        if operation_detail == "fetch_xdr":
            Transaction1.append_change_trust_op(
                asset_code=testnet_main.pathAsset[i]['asset_code'],
                asset_issuer=testnet_main.pathAsset[i]['asset_issuer']
            )

    for i in range(len(testnet_main.pathAsset)):
        if testnet_main.pathAsset[i]['asset_type'] == 'native':
            testnet_main.pathAsset[i]=Asset('XLM')
        else:
            testnet_main.pathAsset[i]=Asset(testnet_main.pathAsset[i]['asset_code'], testnet_main.pathAsset[i]['asset_issuer'])

    testnet_main.pathAsset.insert(0, testnet_main.asset_send)
    testnet_main.pathAsset.append(asset_receive)

    total_receive = 0
    print(f"length: {len(testnet_main.pathAsset)}")
    for i in range(len(testnet_main.pathAsset)-1):
        if (stellar_sdk.LiquidityPoolAsset.is_valid_lexicographic_order(testnet_main.pathAsset[i], testnet_main.pathAsset[i+1])):
            liqpool = stellar_sdk.LiquidityPoolAsset(testnet_main.pathAsset[i], testnet_main.pathAsset[i+1], stellar_sdk.LIQUIDITY_POOL_FEE_V18)
            testnet_main.pathAsset[i].order = 0
        elif (stellar_sdk.LiquidityPoolAsset.is_valid_lexicographic_order(testnet_main.pathAsset[i], testnet_main.pathAsset[i+1]) == False):
            liqpool = stellar_sdk.LiquidityPoolAsset(testnet_main.pathAsset[i+1], testnet_main.pathAsset[i], stellar_sdk.LIQUIDITY_POOL_FEE_V18)
            testnet_main.pathAsset[i].order = 1
        liqpool_id = liqpool.liquidity_pool_id
        response = requests.get('https://horizon-testnet.stellar.org/liquidity_pools/' + liqpool_id)
        testnet_main.liqpool_details = response.json()

        # fetching orderbook details
        testnet_main.ob_details = server.orderbook(testnet_main.pathAsset[i], testnet_main.pathAsset[i+1]).limit(100).call()

        amount_sent_on_liqpool[i] = best_mix_calc_send(i, testnet_main.amount_sent[i])
        amount_sent_on_orderbook[i] = testnet_main.amount_sent[i] - amount_sent_on_liqpool[i]
        received_interleave[i] = mix(i, amount_sent_on_liqpool[i])
        total_receive = received_interleave[i]
        print(f"Loop ke-{i}:")
        print(f"total_receive: {total_receive}")
        if operation_detail == "fetch_amount_receive":
            testnet_main.amount_sent.append(total_receive*(1-slippage))
            continue

        # determining the operation order
        path_amount_liqpool = max(liqpool_calc_send(i, amount_sent_on_liqpool[i]), orderbook_calc_send(amount_sent_on_liqpool[i]))
        path_amount_orderbook = max(liqpool_calc_send(i, amount_sent_on_orderbook[i]), orderbook_calc_send(amount_sent_on_orderbook[i]))

        performance = received_interleave[i] - path_amount_liqpool
        # print(performance)

        amount_receive_lp[i] = liqpool_calc_send(i, amount_sent_on_liqpool[i])
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

        print(f"destmin1: {dest_min1[i]}, destmin2: {dest_min2[i]}")
        print(f"send1: {send_amount1[i]}, send2: {send_amount2[i]}")
        print(f"dest1/send1: {dest_min1[i]/send_amount1[i]}, dest2/send2: {dest_min2[i]/send_amount2[i]}")

        if(send_amount1[i]!=0 and dest_min1[i]!=0):
            Transaction1.append_path_payment_strict_send_op(
                destination=acc.public_key,
                send_code=testnet_main.pathAsset[i].code,
                send_issuer=testnet_main.pathAsset[i].issuer,
                send_amount=str(send_amount1[i]),
                dest_code=testnet_main.pathAsset[i+1].code,
                dest_issuer=testnet_main.pathAsset[i+1].issuer,
                dest_min=str(dest_min1[i]),
                path=[]
            )
        if(send_amount2[i]!=0 and dest_min2[i]!=0):
            Transaction1.append_path_payment_strict_send_op(
                destination=acc.public_key,
                send_code=testnet_main.pathAsset[i].code,
                send_issuer=testnet_main.pathAsset[i].issuer,
                send_amount=str(send_amount2[i]),
                dest_code=testnet_main.pathAsset[i+1].code,
                dest_issuer=testnet_main.pathAsset[i+1].issuer,
                dest_min=str(dest_min2[i]),
                path=[]
            )
        testnet_main.amount_sent.append(dest_min1[i]+dest_min2[i])
    
    if operation_detail == "fetch_amount_receive":
        return total_receive

    Transaction1=Transaction1.build().to_xdr()
    return Transaction1

