import json
import random
import time
import base64

import stellar_sdk
from stellar_sdk import Keypair,Server, TransactionBuilder, Network, Signer, Asset, xdr
import requests


secret_key='SDW5NLCZJEXYK3RNXVZLAPZDMKQNYRVPKZUOFUYBNH4SYNSCJWECSISD'
acc=Keypair.from_secret(secret_key)

server = Server("https://horizon.stellar.org")
base_fee = server.fetch_base_fee()*100

for i in range(100):
    response1 = requests.get('https://horizon.stellar.org/paths/strict-send?destination_assets=yXLM%3AGARDNV3Q7YGT4AKSDF25LT32YSCCW4EV22Y2TV3I2PU2MMXJTEDL5T55&source_asset_type=native&source_amount=1')
    resp1  =response1.json()
    path = resp1['_embedded']['records'][0]['path']
    path_fr1=[]
    for i in range(len(path)):
        path_fr1.append((Asset(path[i]['asset_code'], path[i]['asset_issuer'] )))
    response2 = requests.get('https://horizon.stellar.org/paths/strict-send?destination_assets=yXLM%3AGARDNV3Q7YGT4AKSDF25LT32YSCCW4EV22Y2TV3I2PU2MMXJTEDL5T55&source_asset_type=native&source_amount=1')
    resp2  =response2.json()
    path = resp2['_embedded']['records'][0]['path']
    path_fr2=[]
    for i in range(len(path)):
        path_fr2.append((Asset(path[i]['asset_code'], path[i]['asset_issuer'] )))

    stellar_account1 = server.load_account(acc.public_key)

    Transaction2 = (
        TransactionBuilder(
            source_account=stellar_account1,
            network_passphrase=Network.PUBLIC_NETWORK_PASSPHRASE,
            base_fee=base_fee,
        )
            .append_path_payment_strict_send_op(
            destination=acc.public_key,
            send_code='yXLM',
            send_issuer='GARDNV3Q7YGT4AKSDF25LT32YSCCW4EV22Y2TV3I2PU2MMXJTEDL5T55',
            send_amount='1',
            dest_code='XLM',
            dest_issuer=None,
            dest_min='1',
            path=path_fr2
        )
            .build()
    )

    stellar_account1.sequence += 1
    Transaction1 = (
        TransactionBuilder(
            source_account=stellar_account1,
            network_passphrase=Network.PUBLIC_NETWORK_PASSPHRASE,
            base_fee=base_fee,
        )
            .append_path_payment_strict_send_op(
            destination=acc.public_key,
            send_code='XLM',
            send_issuer=None,
            send_amount='1',
            dest_code='yXLM',
            dest_issuer='GARDNV3Q7YGT4AKSDF25LT32YSCCW4EV22Y2TV3I2PU2MMXJTEDL5T55',
            dest_min='1',
            path=path_fr1
        )
            .build()
    )


    # Signing+Submitting Transaction1
    Transaction1.sign(acc.secret)
    Transaction2.sign(acc.secret)
    response1 = server.submit_transaction(Transaction2)
    response2 = server.submit_transaction(Transaction1)
    print(response1)
    print(response2)



