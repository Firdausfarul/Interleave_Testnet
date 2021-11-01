import json
import random
import time
import base64

import stellar_sdk
from stellar_sdk import Keypair,Server, TransactionBuilder, Network, Signer, Asset, xdr
import requests

server = Server("https://horizon-testnet.stellar.org")
base_fee = server.fetch_base_fee()*1000

issuer_acc = Keypair.random()
distr_acc = Keypair.random()
trader_acc = Keypair.random()

requests.get('https://friendbot.stellar.org?addr='+issuer_acc.public_key)
requests.get('https://friendbot.stellar.org?addr='+distr_acc.public_key)
requests.get('https://friendbot.stellar.org?addr='+trader_acc.public_key)

#creating asset object
test_asset = Asset("IDR", issuer_acc.public_key)

liq_pool = stellar_sdk.LiquidityPoolAsset(Asset.native(), test_asset, stellar_sdk.LIQUIDITY_POOL_FEE_V18)

distr_acc_loaded=server.load_account(distr_acc.public_key);

#Change Trust
#Payment to distr_acc
#Creating liquidity pool
#Deposit Liquidity Pool
#Setting sell order
Transaction1 =(
    TransactionBuilder(
        source_account=distr_acc_loaded,
        network_passphrase=Network.TESTNET_NETWORK_PASSPHRASE,
        base_fee=base_fee,
    )
    .append_change_trust_op(
        asset_code=test_asset.code,
        asset_issuer=test_asset.issuer
    )
    .append_change_trust_op(
        source=trader_acc.public_key,
        asset_code=test_asset.code,
        asset_issuer=test_asset.issuer
    )
    .append_change_trust_liquidity_pool_asset_op(
        asset=liq_pool
    )
    .append_payment_op(
        source=issuer_acc.public_key,
        destination=distr_acc.public_key,
        asset_issuer=test_asset.issuer,
        asset_code=test_asset.code,
        amount='10000'
    )
    .append_liquidity_pool_deposit_op(
        liquidity_pool_id=liq_pool.liquidity_pool_id,
        max_price='1000000',
        min_price='0.000001',
        max_amount_a='2000',
        max_amount_b='2000'
    )
.append_manage_sell_offer_op(
        selling_code=test_asset.code,
        selling_issuer=test_asset.issuer,
        buying_code="XLM",
        buying_issuer=None,
        amount='100',
        price='1'
    )
    .append_manage_sell_offer_op(
        selling_code=test_asset.code,
        selling_issuer=test_asset.issuer,
        buying_code="XLM",
        buying_issuer=None,
        amount='100',
        price='1.1'
    )
    .append_manage_sell_offer_op(
        selling_code=test_asset.code,
        selling_issuer=test_asset.issuer,
        buying_code="XLM",
        buying_issuer=None,
        amount='100',
        price='1.2'
    )
    .append_manage_sell_offer_op(
        selling_code=test_asset.code,
        selling_issuer=test_asset.issuer,
        buying_code="XLM",
        buying_issuer=None,
        amount='100',
        price='1.3'
    )
    .append_manage_sell_offer_op(
        selling_code=test_asset.code,
        selling_issuer=test_asset.issuer,
        buying_code="XLM",
        buying_issuer=None,
        amount='100',
        price='1.4'
    )
    .append_manage_sell_offer_op(
        selling_code=test_asset.code,
        selling_issuer=test_asset.issuer,
        buying_code="XLM",
        buying_issuer=None,
        amount='100',
        price='1.5'
    )
    .append_manage_sell_offer_op(
        selling_code=test_asset.code,
        selling_issuer=test_asset.issuer,
        buying_code="XLM",
        buying_issuer=None,
        amount='100',
        price='1.6'
    )
    .append_manage_sell_offer_op(
        selling_code=test_asset.code,
        selling_issuer=test_asset.issuer,
        buying_code="XLM",
        buying_issuer=None,
        amount='100',
        price='1.7'
    )
    .append_manage_sell_offer_op(
        selling_code=test_asset.code,
        selling_issuer=test_asset.issuer,
        buying_code="XLM",
        buying_issuer=None,
        amount='100',
        price='1.8'
    )
    .append_manage_sell_offer_op(
        selling_code=test_asset.code,
        selling_issuer=test_asset.issuer,
        buying_code="XLM",
        buying_issuer=None,
        amount='100',
        price='1.9'
    )
    .append_manage_sell_offer_op(
        selling_code=test_asset.code,
        selling_issuer=test_asset.issuer,
        buying_code="XLM",
        buying_issuer=None,
        amount='100',
        price='2'
    )
    .append_manage_sell_offer_op(
        selling_code=test_asset.code,
        selling_issuer=test_asset.issuer,
        buying_code="XLM",
        buying_issuer=None,
        amount='100',
        price='2.1'
    )
    .append_manage_sell_offer_op(
        selling_code=test_asset.code,
        selling_issuer=test_asset.issuer,
        buying_code="XLM",
        buying_issuer=None,
        amount='100',
        price='2.2'
    )
    .append_manage_sell_offer_op(
        selling_code=test_asset.code,
        selling_issuer=test_asset.issuer,
        buying_code="XLM",
        buying_issuer=None,
        amount='100',
        price='2.3'
    )
    .append_manage_sell_offer_op(
        selling_code=test_asset.code,
        selling_issuer=test_asset.issuer,
        buying_code="XLM",
        buying_issuer=None,
        amount='100',
        price='2.4'
    )
    .append_manage_sell_offer_op(
        selling_code=test_asset.code,
        selling_issuer=test_asset.issuer,
        buying_code="XLM",
        buying_issuer=None,
        amount='100',
        price='2.5'
    )
    .build()
)
Transaction1.sign(distr_acc.secret)
Transaction1.sign(trader_acc.secret)
Transaction1.sign(issuer_acc.secret)
response = server.submit_transaction(Transaction1)

print('Issuer Public Key = ' + issuer_acc.public_key)
print('Issuer Secret Key = '+ issuer_acc.secret)
print('Distributor Public Key = '+ distr_acc.public_key)
print('Distributor Secret Key = '+ distr_acc.secret)
print('Trader Public Key = '+ trader_acc.public_key)
print('Trader Secret Key = '+ trader_acc.secret)
print('Liquidity Pool Id = ' + liq_pool.liquidity_pool_id)