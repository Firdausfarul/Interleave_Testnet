# Interleave_Testnet
Stellar Protocol 18 upgrade doesn't support interleaved trade execution yet. Interleaved execution is when trade are simultaneously executed in both Liquidity pool and orderbook.
But, interleaved execution could be mimiced by sending 2 path payment operations in 1 transaction, the reason is after the first path payment was executed, 
the liquidity pool and orderbook state will be updated, which also update the path payment routing.

# How this thing works (flowchart soon)
1. User Input the secret key
2. Fetching account details and listing avaible asset on the account
3. User input the transaction details
4. We use ternary search to find the best exchange rate(How much goes to liquidity pool and orderbook)
5. We determine which operation should go first(trade on orderbook or liquidity pool first?)

For now this program only support direct path (no intermediary path)

# ToDo List
1. Adding error details(especially when there's neither orderbook/liquidity pool for that pair)
2. Fixing Rounding error
3. Create a web version

If you want to run this without downloading python compiler, go to https://replit.com/@Firdausfarul/InterleaveTestnet#main.py , Fork it and run it on your own account

You can use setup_testcase.py to generate you testcase
