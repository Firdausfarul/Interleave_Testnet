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
    total=liqpool_calc_send(amount_on_liqpool) + orderbook_calc_send(amount_sent-amount_on_liqpool)
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

secret_key = input('Input Your Stellar Secret Key : ')
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
asset_sent_code = input('You Want To Send : ')
asset_received_code = input('You Want To Receive : ')
amount_sent = input('You Want To Send ( in ' + asset_sent_code + ') : '  )
amount_sent=round(float(amount_sent), 7)
slippage = input('Tolerated Slippage(%) : ')

#finding the asset sent and asset received
for i in range(len(asset)):
    if(asset_sent_code == asset[i].code):
        asset_sent = asset[i]
    if(asset_received_code == asset[i].code):
        asset_received = asset[i]

#fetching liquidity pool
if(stellar_sdk.LiquidityPoolAsset.is_valid_lexicographic_order(asset_sent, asset_received)):
    liqpool = stellar_sdk.LiquidityPoolAsset(asset_sent, asset_received, stellar_sdk.LIQUIDITY_POOL_FEE_V18)
    asset_sent.order=0
elif(stellar_sdk.LiquidityPoolAsset.is_valid_lexicographic_order(asset_sent, asset_received) == False):
    liqpool = stellar_sdk.LiquidityPoolAsset(asset_received, asset_sent, stellar_sdk.LIQUIDITY_POOL_FEE_V18)
    asset_sent.order=1
liqpool_id = liqpool.liquidity_pool_id
response = requests.get('https://horizon-testnet.stellar.org/liquidity_pools/'+liqpool_id)
liqpool_details = response.json()
#fetching orderbook details
ob_details= server.orderbook(asset_sent, asset_received).limit(100).call()

received_lp=liqpool_calc_send(amount_sent)
print('If trade was executed in Liquidity Pool only, You will get : '  +str(received_lp) + asset_received.code)
received_ob=orderbook_calc_send(amount_sent)
print('If trade was executed in Orderbook only, You will get : '  +str(received_ob) + asset_received.code)
path_payment_amount=max(received_lp, received_ob)
print('If trade was executed with ordinary Path Payment, You will get : '  +str(path_payment_amount) + asset_received.code)
amount_sent_on_liqpool = best_mix_calc_send(amount_sent)
received_interleave= mix(amount_sent_on_liqpool)
print('With Interleaved Execution, You will get : '  +str(received_interleave) + asset_received.code)
print('You are getting more : '  +str(received_interleave-path_payment_amount) + asset_received.code)
price_difference= round(((received_interleave-path_payment_amount)/path_payment_amount)*100, 4)
print("That's around : "  +str(price_difference) + ' % More')

amount_sent_on_orderbook = amount_sent-amount_sent_on_liqpool
print(amount_sent_on_orderbook)
print(amount_sent_on_liqpool)
print(orderbook_calc_send(amount_sent_on_orderbook))
print(liqpool_calc_send(amount_sent_on_liqpool))

#determining the operation order
path_amount_liqpool=max(liqpool_calc_send(amount_sent_on_liqpool), orderbook_calc_send(amount_sent_on_liqpool))
path_amount_orderbook=max(liqpool_calc_send(amount_sent_on_orderbook), orderbook_calc_send(amount_sent_on_orderbook))

amount_receive_lp = liqpool_calc_send(amount_sent_on_liqpool)
amount_receive_ob = orderbook_calc_send(amount_sent_on_orderbook)
slippage=float(slippage)/100
slippage=round(1-slippage, 4)

if(path_amount_liqpool==amount_receive_lp):
    send_amount1 = amount_sent_on_liqpool
    dest_min1 = round(amount_receive_lp*slippage,6)
    send_amount2 = amount_sent_on_orderbook
    dest_min2 = round(amount_receive_ob*slippage, 6)
else:
    send_amount2 = amount_sent_on_liqpool
    dest_min2 = round(amount_receive_lp * slippage, 6)
    send_amount1 = amount_sent_on_orderbook
    dest_min1 = round(amount_receive_ob * slippage, 6)

print(dest_min1)
print(dest_min2)
print(send_amount1)
print(send_amount2)


if(input() == 'Y'):
    stellar_account1 = server.load_account(acc.public_key)

    Transaction1 =(
                TransactionBuilder(
                    source_account=stellar_account1,
                    network_passphrase=Network.TESTNET_NETWORK_PASSPHRASE,
                    base_fee=base_fee,
                )
                .append_path_payment_strict_send_op(
                    destination=acc.public_key,
                    send_code=asset_sent.code,
                    send_issuer=asset_sent.issuer,
                    send_amount= str(send_amount1),
                    dest_code = asset_received.code,
                    dest_issuer = asset_received.issuer,
                    dest_min = str(dest_min1),
                    path = []
                )
                .append_path_payment_strict_send_op(
                    destination=acc.public_key,
                    send_code=asset_sent.code,
                    send_issuer=asset_sent.issuer,
                    send_amount=str(send_amount2),
                    dest_code = asset_received.code,
                    dest_issuer = asset_received.issuer,
                    dest_min = str(dest_min2),
                    path = []
                )
                .build()
            )
    #Signing+Submitting Transaction1
    Transaction1.sign(acc.secret)
    response = server.submit_transaction(Transaction1)
    print(response)