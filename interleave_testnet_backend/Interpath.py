import json
import random
import time
import base64
import copy

import stellar_sdk
from stellar_sdk import Keypair,Server, TransactionBuilder, Network, Signer, Asset, xdr
import requests

server=Server('https://horizon.stellar.lobstr.co')

# _calc_ is used to calculate, it returns amount received
# _execute_ is used to modify the lp_details, it returns modified lp_details object

def rount(x):
    return round(x, 7)

def liqpool_send(asset_sent, asset_received, lp_details, amount_sent, type):
    #type execute -> return modified lp_details
    #type calc -> return amount received
    balance = [0, 0]
    amount_sent = round(amount_sent * 0.997, 7)

    modified_lp=copy.deepcopy(lp_details)

    balance[0] = float(modified_lp['reserves'][0]['amount'])  # balanceA
    balance[1] = float(modified_lp['reserves'][1]['amount'])  # balanceB
    pool_product = balance[0] * balance[1]

    if (stellar_sdk.LiquidityPoolAsset.is_valid_lexicographic_order(asset_sent, asset_received)):
        asset_sent.order = 0
    if (stellar_sdk.LiquidityPoolAsset.is_valid_lexicographic_order(asset_sent, asset_received) == False):
        asset_sent.order = 1

    sent=0
    received=1
    if(asset_sent.order == 1):
        sent, received = received, sent

    balance[sent] = round(balance[sent] + amount_sent, 7)
    z = pool_product / balance[sent]
    amount_received = round((balance[received] - z), 7)
    balance[received] = round(balance[received] - amount_received, 7)
    modified_lp['reserves'][sent]['amount']=str(balance[sent])
    modified_lp['reserves'][received]['amount']=str(balance[received])
    if(type=='calc'):
        return amount_received
    elif(type=='execute'):
        return modified_lp


def orderbook_send(asset_sent, asset_received, ob_details, amount_sent, type):
    # type execute -> return modified ob_details
    # type calc -> return amount received
    modified_ob=copy.deepcopy(ob_details)

    if (stellar_sdk.LiquidityPoolAsset.is_valid_lexicographic_order(asset_sent, asset_received)):
        asset_sent.order = 0
    if (stellar_sdk.LiquidityPoolAsset.is_valid_lexicographic_order(asset_sent, asset_received) == False):
        asset_sent.order = 1

    offer_type='bids'
    if(asset_sent.order==1):
        offer_type='asks'

    depth=0
    amount_received=0

    for i in range(len(modified_ob[offer_type])):
        price = float(modified_ob[offer_type][0]['price'])
        if(asset_sent.order==1):
            price = 1/float(modified_ob[offer_type][0]['price'])
        amount = float(modified_ob[offer_type][0]['amount'])
        depth=(rount(1 / price * amount))
        if (amount_sent >= depth):
            amount_received = rount(amount_received + amount)
            amount_sent = rount(amount_sent - depth)
            modified_ob[offer_type].pop(0)
            if (amount_sent <= 0):
                if (type == 'calc'):
                    return round(amount_received, 7)
                elif (type == 'execute'):
                    return modified_ob
        elif (amount_sent < depth):
            marginal_amount_received = amount_sent / depth * amount
            amount_received = rount(amount_received + marginal_amount_received)
            modified_ob[offer_type][0]['amount'] = str(round(amount - marginal_amount_received, 7))
            amount_sent = 0
            if (type == 'calc'):
                return round(amount_received, 7)
            elif (type == 'execute'):
                return modified_ob

def path_send(path, amount_sent, type):
    #type=calc -> return price
    #type execute -> editing the lp and ob, return list : result[0]=source_amount ; result[1]=destination_amount ;
    #result[2]=price
    source_amount_sent=amount_sent
    for i in range(len(path.path)-1):
        if (stellar_sdk.LiquidityPoolAsset.is_valid_lexicographic_order(path.path[i], path.path[i + 1])):
            asset_A = path.path[i]
            asset_B = path.path[i + 1]
        if (stellar_sdk.LiquidityPoolAsset.is_valid_lexicographic_order(path.path[i], path.path[i + 1]) == False):
            asset_B = path.path[i]
            asset_A = path.path[i + 1]

        for j in range(len(market)):
            if(asset_A==market[j].asset_A and asset_B==market[j].asset_B):
                ob_details=market[j].ob_details
                lp_details=market[j].lp_details
                market_index=j
                break

        received_ob=orderbook_send(
            type='calc',
            asset_sent=path.path[i],
            asset_received=path.path[i+1],
            ob_details=ob_details,
            amount_sent=amount_sent
        )
        received_lp=liqpool_send(
            type='calc',
            asset_sent=path.path[i],
            asset_received=path.path[i + 1],
            lp_details=lp_details,
            amount_sent=amount_sent
        )
        received_path=max(received_lp, received_ob)
        if (type=='execute'):
            if (received_lp>=received_ob):
                print('liquidity_pool')
                market[market_index].lp_details=liqpool_send(
                    type='execute',
                    asset_sent=path.path[i],
                    asset_received=path.path[i + 1],
                    lp_details=lp_details,
                    amount_sent=amount_sent
                )
            elif (received_lp < received_ob):
                print('orderbook')
                market[market_index].ob_details = orderbook_send(
                    type='execute',
                    asset_sent=path.path[i],
                    asset_received=path.path[i + 1],
                    ob_details=ob_details,
                    amount_sent=amount_sent
                )
        amount_sent=received_path
    price=received_path/source_amount_sent
    if (type=='execute'):
        result=[]
        result.append(round(source_amount_sent,7))
        result.append(round(received_path, 7))
        result.append(round(price, 7))
        return result
    if (type=='calc'):
        return round(price, 7)


#Orderbook are fetched by their lexicographic orderjust like LP)
#AssetA = sell ; Asset B = Buy
class Market_details:
    # AssetA = sell ; Asset B = Buy
    def __init__(self, ob_details, lp_details, asset_A, asset_B):
        self.ob_details=ob_details
        self.lp_details=lp_details
        self.asset_A=asset_A
        self.asset_B=asset_B

class Pathing:
    def __init__(self, path, price):
        self.path = path
        self.price = price
        self.amount_sent = 0
        self.amount_received = 0

asset_sent=Asset('LSP', 'GAB7STHVD5BDH3EEYXPI3OM7PCS4V443PYB5FNT6CFGJVPDLMKDM24WK')
asset_received=Asset('XLM')
source_asset=asset_sent
destination_asset=asset_received

amount_sent=100000
slippage=0.01
slippage=slippage/100
acc='GAB7STHVD5BDH3EEYXPI3OM7PCS4V443PYB5FNT6CFGJVPDLMKDM24WK'
loops=10


#ToDo : Handle Case if not divisible by 100
loop_amount=round(amount_sent/loops, 7)
leftover=amount_sent-loop_amount*100

path=[]
market=[]

pathresp = server.strict_send_paths(
    source_asset=asset_sent,
    source_amount=loop_amount,
    destination=[asset_received]
).limit(2).call()
print(pathresp)


pathtoad=pathresp['_embedded']['records']

for i in range(len(pathtoad)):
    path_temp = []
    path_temp.append(asset_sent)
    for j in range(len(pathtoad[i]['path'])):
        if pathtoad[i]['path'][j]['asset_type']=='native':
            path_temp.append('XLM')
        else:
            path_temp.append(Asset(pathtoad[i]['path'][j]['asset_code'], pathtoad[i]['path'][j]['asset_issuer']))
    path_temp.append(asset_received)

    received_temp=float(pathtoad[i]['destination_amount'])
    sent_temp=float(pathtoad[i]['source_amount'])
    price_temp=round(received_temp/sent_temp ,7)
    path.append(Pathing(path=path_temp, price=price_temp))

for i in range(len(path)):
    for j in range(len(path[i].path)-1):

        asset_sent = path[i].path[j]
        asset_received = path[i].path[j+1]

        if (stellar_sdk.LiquidityPoolAsset.is_valid_lexicographic_order(asset_sent, asset_received)):
            asset_A = asset_sent
            asset_B = asset_received
        if (stellar_sdk.LiquidityPoolAsset.is_valid_lexicographic_order(asset_sent, asset_received) == False):
            asset_B = asset_sent
            asset_A = asset_received

        lp_id = stellar_sdk.LiquidityPoolAsset(asset_A, asset_B)
        lp_id = lp_id.liquidity_pool_id
        lp_details = server.liquidity_pools().liquidity_pool(lp_id).call()
        ob_details = server.orderbook(asset_A, asset_B).limit(200).call()
        market_temp=(Market_details(
            asset_A=asset_A,
            asset_B=asset_B,
            lp_details=lp_details,
            ob_details=ob_details
        ))
        market_duplicate=False
        for k in range(len(market)):
            if(market[k].asset_A==market_temp.asset_A and market[k].asset_B==market_temp.asset_B):
                market_duplicate=True
        if (market_duplicate==False):
            market.append(market_temp)

for h in range(loops):
    temp_result=path_send(path=path[0], amount_sent=loop_amount, type='execute')
    path[0].amount_sent= path[0].amount_sent + temp_result[0]
    path[0].amount_received= path[0].amount_received + temp_result[1]
    print(h, temp_result[1])
    for g in range(len(path)):
        path[g].price=path_send(path=path[g], amount_sent=loop_amount, type='calc')
    path.sort(key=lambda x: x.price, reverse=True)

total_received=0
#print('Asli', pathresp[0]['destination'])
for r in range(len(path)):
    print(path[r].amount_sent)
    print(path[r].amount_received)
    print(path[r].price)
    total_received=total_received+path[r].amount_received
print(total_received)

loaded_acc=server.load_account(acc)

Transaction=TransactionBuilder(
    source_account=loaded_acc,
    network_passphrase=Network.PUBLIC_NETWORK_PASSPHRASE,
    base_fee=100000
)
for r in range(len(path)):
    if(path[r].amount_sent==0):
        break
    path[r].path.pop(len(path[r].path)-1)
    path[r].path.pop(0)
    Transaction.append_path_payment_strict_send_op(
        send_code=source_asset.code,
        send_issuer=source_asset.issuer,
        send_amount=str(rount(path[r].amount_sent)),
        destination=acc,
        dest_code=destination_asset.code,
        dest_issuer=destination_asset.issuer,
        dest_min=str(rount(path[r].amount_received*slippage)),
        path=path[r].path
    )
Transaction=Transaction.build().to_xdr()
print(Transaction)
