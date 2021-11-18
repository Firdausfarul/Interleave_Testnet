import json
import random
import time
import base64

import stellar_sdk
from stellar_sdk import Keypair,Server, TransactionBuilder, Network, Signer, Asset, xdr
import requests

server = Server("https://horizon-testnet.stellar.org")
base_fee = server.fetch_base_fee()*1000

#Function for calculating amount received given the amount of asset sent
def liqpool_calc_send(amount_sent) :
    balance = [0,0]
    amount_sent=round(amount_sent*0.997, 7)
    if(asset_sent.type != 'native'):
        asset_info = asset_sent.code +':' + asset_sent.issuer
    else :
        asset_info = 'native'
    balance[0]=float(liqpool_details['reserves'][0]['amount']) #balanceA
    balance[1]=float(liqpool_details['reserves'][1]['amount']) #balanceB
    pool_product=balance[0]*balance[1]
    if(asset_sent.order == 0):
        balance_after=balance[0]+amount_sent
        z=pool_product/balance_after
        amount_received=round((balance[1]-z), 7)
        #print((balance[1] - amount_received) * (balance[0] + amount_sent))
        return amount_received
    elif(asset_sent.order == 1):
        balance_after=balance[1]+amount_sent
        z=pool_product/balance_after
        amount_received = round((balance[0]-z), 7)
        #print((balance[0]-amount_received)*(balance[1]+amount_sent))
        return amount_received

#Function for calculating amount received given the amount of asset sent (for orderbook)
def orderbook_calc_send(amount_sent):
    depth=[]
    amount_received=0
    for i in range(len(ob_details['bids'])):
        depth.append(round(1/float(ob_details['bids'][i]['price'])*float(ob_details['bids'][i]['amount']), 7))
        if(amount_sent>=depth[i]):
            amount_received=amount_received+float(ob_details['bids'][i]['amount'])
            amount_sent=amount_sent-depth[i]
            if(amount_sent==0):
                return round(amount_received, 7)
        elif(amount_sent<depth[i]):
            amount_received=amount_received+round((amount_sent/depth[i])*float(ob_details['bids'][i]['amount']), 7)
            amount_sent=0
            return round(amount_received, 7)

def mix(amount_on_liqpool):
    #print('toad')
    #print(amount_sent[i])
    #print(amount_on_liqpool)
    #print(amount_sent[i]-amount_on_liqpool)
    #print(orderbook_calc_send(amount_sent[i]-amount_on_liqpool))
    total=liqpool_calc_send(amount_on_liqpool) + orderbook_calc_send(amount_sent[i]-amount_on_liqpool)
    return round(total, 7)

#Finding the best combination of LP:Orderbook using ternary search
def best_mix_calc_send(amount_sent):
    accuracy = 0.0000001 #decimal accuracy
    l=0
    r=amount_sent
    while(r-l > accuracy):
        m1 = l + (r-l) / 3
        m2= r - (r-l) / 3
        f1= mix(m1)
        f2= mix(m2)
        if(f1<f2):
            l = m1
        else:
            r=m2
    l=round(l, 7)
    return l #returning the amount sent that should be sent to liquidity pool

asset=[]
amount_sent=[]
send_amount1=[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
send_amount1=[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
send_amount2=[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
dest_min1=[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
dest_min2=[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
amount_sent_on_liqpool=[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
amount_sent_on_orderbook=[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
amount_receive_lp=[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
amount_receive_ob=[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
received_interleave=[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

secret_key='SAITOZ4RADEDVT4PEGW3XHHUTT6RBIXEBY4DD7TN2PSQDVAF5ARETSSA'
acc=Keypair.from_secret(secret_key)
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
#User Input
asset_sent_code = 'YBX'
asset_received_code = 'TERN'
amount_send = '5000'
amount_send=round(float(amount_send), 7)
amount_sent.append(amount_send)
slippage = '0.01'

#finding the asset sent and asset received
for i in range(len(asset)):
    if(asset_sent_code == asset[i].code):
        asset_sent = asset[i]
    if(asset_received_code == asset[i].code):
        asset_received = asset[i]

destine=[asset_received]

pathresp = server.strict_send_paths(
    source_asset=asset_sent,
    source_amount=amount_sent[0],
    destination=destine
).call()
path=pathresp['_embedded']['records']
print(path[0]['destination_amount'])
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
    Transaction1.append_change_trust_op(
        asset_code=pathAsset[i]['asset_code'],
        asset_issuer=pathAsset[i]['asset_issuer']
    )

for i in range(len(pathAsset)):
    pathAsset[i]=Asset(pathAsset[i]['asset_code'], pathAsset[i]['asset_issuer'])

pathAsset.insert(0, asset_sent)
pathAsset.append(asset_received)

for i in range(len(pathAsset)-1):
    if (stellar_sdk.LiquidityPoolAsset.is_valid_lexicographic_order(pathAsset[i], pathAsset[i+1])):
        liqpool = stellar_sdk.LiquidityPoolAsset(pathAsset[i], pathAsset[i+1], stellar_sdk.LIQUIDITY_POOL_FEE_V18)
        pathAsset[i].order = 0
    elif (stellar_sdk.LiquidityPoolAsset.is_valid_lexicographic_order(pathAsset[i], pathAsset[i+1]) == False):
        liqpool = stellar_sdk.LiquidityPoolAsset(pathAsset[i+1], pathAsset[i], stellar_sdk.LIQUIDITY_POOL_FEE_V18)
        pathAsset[i].order = 1
    liqpool_id = liqpool.liquidity_pool_id
    response = requests.get('https://horizon-testnet.stellar.org/liquidity_pools/' + liqpool_id)
    liqpool_details = response.json()
    # fetching orderbook details
    ob_details = server.orderbook(pathAsset[i], pathAsset[i+1]).limit(100).call()

    amount_sent_on_liqpool[i] = best_mix_calc_send(amount_sent[i])
    amount_sent_on_orderbook[i] = amount_sent[i] - amount_sent_on_liqpool[i]
    received_interleave[i] = mix(amount_sent_on_liqpool[i])

    # determining the operation order
    path_amount_liqpool = max(liqpool_calc_send(amount_sent_on_liqpool[i]), orderbook_calc_send(amount_sent_on_liqpool[i]))
    path_amount_orderbook = max(liqpool_calc_send(amount_sent_on_orderbook[i]), orderbook_calc_send(amount_sent_on_orderbook[i]))

    amount_receive_lp[i] = liqpool_calc_send(amount_sent_on_liqpool[i])
    amount_receive_ob[i] = orderbook_calc_send(amount_sent_on_orderbook[i])
    slippage = float(slippage) / 100
    slippage = round(1 - slippage, 4)

    if (path_amount_liqpool == amount_receive_lp[i]):
        send_amount1[i] = round(amount_sent_on_liqpool[i],6)
        dest_min1[i] = round(amount_receive_lp[i] * slippage, 6)
        send_amount2[i] = round(amount_sent_on_orderbook[i],6)
        dest_min2[i] = round(amount_receive_ob[i] * slippage, 6)
    else:
        send_amount2[i] = round(amount_sent_on_liqpool[i], 6)
        dest_min2[i] = round(amount_receive_lp[i] * slippage, 6)
        send_amount1[i] = round(amount_sent_on_orderbook[i], 6)
        dest_min1[i] = round(amount_receive_ob[i] * slippage, 6)
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
    amount_sent.append(dest_min1[i]+dest_min2[i])

Transaction1=Transaction1.build()
Transaction1.sign(acc.secret)
print(server.submit_transaction(Transaction1))
