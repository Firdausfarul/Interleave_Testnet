import json
import random
import time
import base64
import sys
import stellar_sdk
from stellar_sdk import Keypair,Server, TransactionBuilder, Network, Signer, Asset, xdr
import requests

server = Server("https://horizon.stellar.org")
base_fee = server.fetch_base_fee()*1000

#Function for calculating amount received given the amount of asset sent
def liqpool_calc_send(amount_sent) :
    balance = [0,0]
    fee_adjust=1-(Liquidity_Pool_Fee/100)
    amount_sent=round(amount_sent*fee_adjust, 7)
    if(asset_sent.type != 'native'):
        asset_info = asset_sent.code +':' + asset_sent.issuer
    else :
        asset_info = 'native'
    balance[0]=float(liqpool_details['reserves'][0]['amount'])*Liquidity_Pool_Multiplier #balanceA
    balance[1]=float(liqpool_details['reserves'][1]['amount'])*Liquidity_Pool_Multiplier #balanceB
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

#User Input
amount_sent=1000
Liquidity_Pool_Multiplier=1
Liquidity_Pool_Fee=0.3 #percentage

XLM=Asset('XLM')
USDC=Asset('USDC', 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN')
LSP=Asset('LSP','GAB7STHVD5BDH3EEYXPI3OM7PCS4V443PYB5FNT6CFGJVPDLMKDM24WK')
SLT=Asset('SLT', 'GCKA6K5PCQ6PNF5RQBF7PQDJWRHO6UOGFMRLK3DYHDOI244V47XKQ4GP')
AQUA=Asset('AQUA','GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA')

#finding the asset sent and asset received
asset_sent=SLT
asset_received=XLM
#fetching liquidity pool
if(stellar_sdk.LiquidityPoolAsset.is_valid_lexicographic_order(asset_sent, asset_received)):
    liqpool = stellar_sdk.LiquidityPoolAsset(asset_sent, asset_received, stellar_sdk.LIQUIDITY_POOL_FEE_V18)
    asset_sent.order=0
elif(stellar_sdk.LiquidityPoolAsset.is_valid_lexicographic_order(asset_sent, asset_received) == False):
    liqpool = stellar_sdk.LiquidityPoolAsset(asset_received, asset_sent, stellar_sdk.LIQUIDITY_POOL_FEE_V18)
    asset_sent.order=1
liqpool_id = liqpool.liquidity_pool_id
response = requests.get('https://horizon.stellar.org/liquidity_pools/'+liqpool_id)
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
print('sent on orderbook : ' + str(amount_sent_on_orderbook))
print('sent on liquidity pool: '+str(amount_sent_on_liqpool))
print('received from orderbook : '+str(orderbook_calc_send(amount_sent_on_orderbook)))
print('received from liquidity pool : '+ str(liqpool_calc_send(amount_sent_on_liqpool)))

price_liquiditypool=round(liqpool_calc_send(amount_sent_on_liqpool)/amount_sent_on_liqpool, 7)
price_orderbook=round(orderbook_calc_send(amount_sent_on_orderbook)/amount_sent_on_orderbook, 7)
price_total=round(received_interleave/amount_sent, 7)
print('Price LP : ' +str(price_liquiditypool))
print('Price OB : ' + str(price_orderbook))
print('Price Interleave : ' + str(price_total))

print(len(str(ob_details)))