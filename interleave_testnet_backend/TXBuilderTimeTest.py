import stellar_sdk
from stellar_sdk import Keypair,Server, TransactionBuilder, Network, Signer, Asset, xdr
import requests
import time
start_time = time.time()

server = Server("https://horizon.stellar.org")
base_fee = server.fetch_base_fee()*1000

destination=''
source_acc='GDHGET7YFRXKFK6FA3TL6B5CAY3P7J2KM3MYHKO2CHUXWEYH7BDACBVH'
amountoad=9

toad = server.claimable_balances().for_claimant(source_acc).limit(100).call()
print(toad)

acc=server.load_account(source_acc);

Transaction1 = TransactionBuilder(
        source_account=acc,
        network_passphrase=Network.PUBLIC_NETWORK_PASSPHRASE,
        base_fee=base_fee,
    )

for i in range(len(toad['_embedded']['records'])):
    Transaction1.append_claim_claimable_balance_op(
        balance_id=toad['_embedded']['records'][i]['id']
    )
Transaction1.append_payment_op(
    destination=destination,
    asset_code='XLM',
    asset_issuer=None,
    amount=str(amountoad)
)
Transaction1=Transaction1.build().to_xdr()
print(Transaction1)
