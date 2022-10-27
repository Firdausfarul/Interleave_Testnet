/* global _ */

import {
  Server,
  Asset,
  LiquidityPoolAsset,
  LiquidityPoolFeeV18,
  getLiquidityPoolId,
  Networks,
  TransactionBuilder,
  Operation,
  MemoText,
  TimeoutInfinite,
  Memo,
} from "stellar-sdk";

const pathServer = new Server("https://horizon.stellar.org"); //pathfinder horizon instance
const server = new Server("https://horizon.stellar.org");

//fee are in bps/0.01% of profit
const neptunusFee = 800; //10% of profit
const platformFee = 200;
const neptunusAddress =
  "GAM6VCFJLV4FMUTRXSWNK7OMWBXLNOIHHGGM25LOPF36UP7UZ47MNPTN";
const platformAddress = neptunusAddress;

var market = [];

//if there's any discount NFT in ze future
//const discountIssuer='';
//const discountCode='';
//const discount=new Asset(discountCode, discountIssuer);

//for storing path details
let Pathing = class {
  constructor(path, price) {
    this.path = path;
    this.price = price;
    this.sourceAmount = 0;
    this.destinationAmount = 0;
  }
};

//storing lp and orderbook state
let MarketDetails = class {
  constructor(assetA, assetB, obDetails, lpDetails) {
    //ordered lexicographically
    this.assetA = assetA;
    this.assetB = assetB;
    this.obDetails = obDetails;
    this.lpDetails = lpDetails;
  }
};

//for executing tx
let txInfo = class {
  constructor(sourceAmount, destinationAmount, path) {
    this.sourceAmount = sourceAmount;
    this.destinationAmount = destinationAmount;
    this.path = path;
  }
};

//converting horizon request into array of assets(for transaction)
function pathReqToObject(sourceAsset, destinationAsset, path) {
  var path_temp = [sourceAsset];
  for (let j = 0; j < path.length; j++) {
    if (path[j].asset_type == "native") {
      var temp_asset = new Asset("XLM");
      path_temp.push(temp_asset);
    } else {
      temp_asset = new Asset(path[j].asset_code, path[j].asset_issuer);
      path_temp.push(temp_asset);
    }
  }
  path_temp.push(destinationAsset);
  return path_temp;
}

//round to the 7th decimal for building operations
function round(num) {
  return Math.floor(num * 10000000) / 10000000;
}

//ordering asset by lexicographic order
function orderAssets(A, B) {
  return Asset.compare(A, B) <= 0 ? [A, B] : [B, A];
}

//fetching orderbook state (ordered by lexicographical order)
async function fetchOrderbook(assetA, assetB) {
  var orderedAsset = orderAssets(assetA, assetB); //ordering asset by lexicographical order
  return await server
    .orderbook(orderedAsset[0], orderedAsset[1])
    .limit(200)
    .call();
}

//fetching liquiditypool state
async function fetchLiqpool(assetA, assetB) {
  var orderedAsset = orderAssets(assetA, assetB);
  //making new pool object and getting poolId
  var lp = new LiquidityPoolAsset(
    orderedAsset[0],
    orderedAsset[1],
    LiquidityPoolFeeV18
  );
  var poolId = getLiquidityPoolId(
    "constant_product",
    lp.getLiquidityPoolParameters()
  ).toString("hex");
  //not all pair have existing pool, so we use exception
  try {
    return await server.liquidityPools().liquidityPoolId(poolId).call();
  } catch (e) {
    return 0;
  }
}

//fetching market detail for a given pair
async function fetchMarket(assetA, assetB) {
  let promise_temp = [
    fetchOrderbook(assetA, assetB),
    fetchLiqpool(assetA, assetB),
  ];
  let promise_res = await Promise.all(promise_temp);
  var temp_ob = promise_res[0];
  var temp_lp = promise_res[1];
  var temp_market = new MarketDetails(assetA, assetB, temp_ob, temp_lp);
  market.push(temp_market);
}

//Simulating liquidity pool execution
function liqpoolSend(
  sourceAsset,
  destinationAsset,
  lpDetails,
  sourceAmount,
  type
) {
  //substract the 0.3% liquidityPool fee
  sourceAmount = sourceAmount * 0.997;
  //type execute -> return modified lpDetails
  //type calc -> return destinationAmount
  var balance = [0, 0];

  //if pool doesn't exist
  if (lpDetails == 0) {
    return 0;
  }

  //Deepcopying lpDetails
  var modifiedLp = JSON.parse(JSON.stringify(lpDetails));

  //getting assets balances on liquidity pool
  balance[0] = parseFloat(modifiedLp.reserves[0].amount);
  balance[1] = parseFloat(modifiedLp.reserves[1].amount);
  var poolProduct = balance[0] * balance[1];

  //getting source and destination asset index on liquidity pool
  var temps = orderAssets(sourceAsset, destinationAsset);

  var sent = 0;
  var received = 1;

  if (Asset.compare(sourceAsset, temps[1]) == 0) {
    sent = 1;
    received = 0;
  }

  //calculating destinationAmount
  balance[sent] = balance[sent] + sourceAmount;
  var z = poolProduct / balance[sent];
  var destinationAmount = round(balance[received] - z);
  balance[received] = round(balance[received] - destinationAmount);
  modifiedLp.reserves[sent].amount = balance[sent].toString();
  modifiedLp.reserves[received].amount = balance[received].toString();

  //if type is calc return destinationAmount
  if (type == "calc") {
    return destinationAmount;
  }
  //if type is execute return modified liquidity pool state
  else if (type == "execute") {
    return modifiedLp;
  }
}

//simulating orderbook execution
function orderbookSend(
  sourceAsset,
  destinationAsset,
  obDetails,
  sourceAmount,
  type
) {
  //type execute -> return modified ObDetails
  //type calc -> return destinationAmount

  //Deepcopy modifiedOb
  var modifiedOb = JSON.parse(JSON.stringify(obDetails));
  //getting source and destination asset index on liquidity pool
  var temps = orderAssets(sourceAsset, destinationAsset);
  var offerType = "bids";
  if (Asset.compare(sourceAsset, temps[1]) == 0) {
    offerType = "asks";
  }

  var depth = 0;
  var destinationAmount = 0;

  //loop until sourceAmount is 0
  while (sourceAmount >= 0) {
    /*not all pair have existing orderbook, so we use exception. 
          or if the orderbook has been exhausted by previous loop
        */
    try {
      /*
            using fraction to get more accurate price, especially for pair with significant price difference
            (i.e Aqua-BTC) because the decimal in JSON request is less accurate
            */
      var price =
        parseFloat(modifiedOb[offerType][0].price_r.n) /
        parseFloat(modifiedOb[offerType][0].price_r.d);
    } catch (e) {
      if (type == "calc") {
        return round(destinationAmount);
      }
      if (type == "execute") {
        return modifiedOb;
      }
    }

    //reversing price if order are reversed
    if (Asset.compare(sourceAsset, temps[1]) == 0) {
      price = 1 / price;
    }
    //calculating destinationAmount
    var amount = parseFloat(modifiedOb[offerType][0].amount);
    var depth = round((1 / price) * amount);

    //fully execute on depth
    if (sourceAmount >= depth) {
      destinationAmount = round(destinationAmount + amount);
      sourceAmount = round(sourceAmount - depth);
      //pop the first offer blocks, because it has been fully executed
      modifiedOb[offerType].shift();
      if (sourceAmount <= 0) {
        if (type == "calc") {
          return round(destinationAmount);
        }
        if (type == "execute") {
          return modifiedOb;
        }
      }
    }
    //partially execute on depth
    else if (sourceAmount < depth) {
      var marginalDestinationAmount = (sourceAmount / depth) * amount;
      destinationAmount = round(destinationAmount + marginalDestinationAmount);
      //editting the offer blocks, because it's only partially executed
      modifiedOb[offerType][0].amount = round(
        amount - marginalDestinationAmount
      ).toString();
      sourceAmount = 0;
      if (type == "calc") {
        return round(destinationAmount);
      }
      if (type == "execute") {
        return modifiedOb;
      }
    }
  }
}

//simulating path payment
function pathSend(path, sourceAmount, type) {
  //type execute -> return edited the lp and ob,
  //return list : result[0]=source_amount ; result[1]=destination_amount ; result[2]=price
  //type calcPrice -> price
  //type calc -> receivedAmount
  var sentAmount = sourceAmount;
  //loop for the whole path
  for (let i = 0; i < path.path.length - 1; i++) {
    //searching the corresponding market details
    var temps = orderAssets(path.path[i], path.path[i + 1]);
    for (let j = 0; j < market.length; j++) {
      if (
        Asset.compare(market[j].assetA, temps[0]) == 0 &&
        Asset.compare(market[j].assetB, temps[1]) == 0
      ) {
        var ob_details = market[j].obDetails;
        var lp_details = market[j].lpDetails;
        var marketIndex = j;
        break;
      }
    }
    //choose the best price out of lp and ob
    var receivedOb = orderbookSend(
      path.path[i],
      path.path[i + 1],
      ob_details,
      sentAmount,
      "calc"
    );

    var receivedLp = liqpoolSend(
      path.path[i],
      path.path[i + 1],
      lp_details,
      sentAmount,
      "calc"
    );

    var receivedPath = Math.max(receivedLp, receivedOb);
    //editting the lp or ob states if type is execute
    if (type == "execute") {
      //if lp give better rates, edit lp state
      if (receivedLp >= receivedOb) {
        market[marketIndex].lpDetails = liqpoolSend(
          path.path[i],
          path.path[i + 1],
          lp_details,
          sentAmount,
          "execute"
        );
      }
      //if ob give better rates, edit ob state
      else if (receivedLp < receivedOb) {
        market[marketIndex].obDetails = orderbookSend(
          path.path[i],
          path.path[i + 1],
          ob_details,
          sentAmount,
          "execute"
        );
      }
    }
    //next loop
    sentAmount = receivedPath;
  }
  //calculating avg price for the whole trade
  var price = sourceAmount / receivedPath;

  //return
  if (type == "calc") {
    return round(receivedPath);
  } else if (type == "price") {
    return price;
  } else if (type == "execute") {
    return {
      sourceAmount: sourceAmount,
      destinationAmount: round(receivedPath),
      price: price,
    };
  }
}

//temporary replacing horizon pathfinding algo(they only return 1 path after the update)🥺
async function router(sourceAsset, destinationAsset) {
  //assets with massive liquidity
  const aqua = new Asset(
    "AQUA",
    "GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA"
  );
  const xlm = new Asset("XLM");
  const usdc = new Asset(
    "USDC",
    "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
  );

  return [
    [sourceAsset, destinationAsset],
    [sourceAsset, xlm, destinationAsset],
    [sourceAsset, aqua, destinationAsset],
    [sourceAsset, usdc, destinationAsset],
    [sourceAsset, xlm, usdc, destinationAsset],
    [sourceAsset, xlm, aqua, destinationAsset],
    [sourceAsset, aqua, xlm, destinationAsset],
    [sourceAsset, aqua, xlm, destinationAsset],
    [sourceAsset, usdc, xlm, destinationAsset],
    [sourceAsset, usdc, aqua, destinationAsset],
  ];
}

//checking for duplicate from router()
async function checkpath(_pathList) {
  var _result = [];
  //iterate for every path on pathlist
  for (let i = 0; i < _pathList.length; i++) {
    var _path = _pathList[i];
    var isDuplicate = false;
    //iterate for every asset in the path
    for (let j = 0; j < _path.length - 1; j++) {
      //check if duplicate
      if (Asset.compare(_path[0], _path[j]) == 0 && j != 0) {
        isDuplicate = true;
      }
      if (
        Asset.compare(_path[_path.length - 1], _path[j]) == 0 &&
        j != _path.length - 1
      ) {
        isDuplicate = true;
      }
      //splice/cut array if duplicate asset found
      if (Asset.compare(_path[j], _path[j + 1]) == 0) {
        _path.splice(j, 1);
        j--;
      }
    }
    if (isDuplicate == false) {
      _result.push(_path);
    }
  }
  return _result;
}

//external function
//used to calculate path combination and calculating amount received
export async function neptunusCalculate(
  sourceAsset,
  destinationAsset,
  sourceAmount
) {
  console.log(sourceAmount)
  market = [];
  //fetching path and parsing it
  console.log(market);
  var pathResponse = await pathServer
    .strictSendPaths(sourceAsset, sourceAmount.toString(), [destinationAsset])
    .limit(5)
    .call();
  var pathsList = pathResponse.records;
  var normalAmount = parseFloat(pathsList[0].destination_amount);
  var destinationAmount = 0;
  var pairsList = [];
  var paths = [];
  var txDetails = [];
  /*Edgecase :
        Small source amount && Low Valued token -> High Valued Token (e.g 1 AQUA -> BTC), loopAmount become so small that it yields 0 output after function.
        Very Small source amount ==> 0.000001 XXX -> YYY, loopAmount = 0;
        Solution :
            >Compare the result to normal path payment
            >If Normal Path Payment yield more result, use normal path payment
    */
  //how many loops
  //more loops are generally more profitable
  var loops = 48;
  var loopsAmount = round(sourceAmount / loops);
  var leftover = sourceAmount - loopsAmount * loops; //rounding error

  //same as pathreq to obj but it also process amount
  for (let i = 0; i < pathsList.length; i++) {
    var path_temp = [sourceAsset];
    for (let j = 0; j < pathsList[i].path.length; j++) {
      if (pathsList[i].path[j].asset_type == "native") {
        var temp_asset = new Asset("XLM");
        path_temp.push(temp_asset);
      } else {
        temp_asset = new Asset(
          pathsList[i].path[j].asset_code,
          pathsList[i].path[j].asset_issuer
        );
        path_temp.push(temp_asset);
      }
    }
    path_temp.push(destinationAsset);
    var temp_price =
      parseFloat(pathsList[i].destination_amount) /
      parseFloat(pathsList[i].source_amount);
    var temps = new Pathing(path_temp, temp_price);
    paths.push(temps);
  }
  //router()
  var pathz = await checkpath(await router(sourceAsset, destinationAsset));
  for (let i = 0; i < pathz.length; i++) {
    temps = new Pathing(pathz[i], 0);
    paths.push(temps);
  }
  //most profitable/default path
  var normalPath = paths[0].path;
  //fetching market details
  var promiseMarket = [];

  for (let i = 0; i < paths.length; i++) {
    for (let j = 0; j < paths[i].path.length - 1; j++) {
      var temp_assets = orderAssets(paths[i].path[j], paths[i].path[j + 1]);

      var marketDuplicate = false;
      //check if market already fetched
      for (let k = 0; k < pairsList.length; k++) {
        if (
          pairsList[k][0] == temp_assets[0] &&
          pairsList[k][1] == temp_assets[1]
        ) {
          marketDuplicate = true;
          break;
        }
      }
      if (marketDuplicate == true) {
        continue;
      }
      //pairsList = fetched asset
      pairsList.push(temp_assets);
      //fetching market details
      promiseMarket.push(fetchMarket(temp_assets[0], temp_assets[1]));
    }
  }

  //waiting for all market details to be fetched
  var promiseMarketResult = await Promise.all(promiseMarket);

  var destinationAmount =0;
  //choosing the best path each loop
  for (let h = 0; h < loops; h++) {
    //execute pathSend()
    var temp_result = pathSend(paths[0], loopsAmount, "execute");
    //append txDetails with the above result
    var temp_info = new txInfo(
      temp_result.sourceAmount,
      temp_result.destinationAmount,
      paths[0].path
    );

    txDetails.push(temp_info);
    //storing amout sent and received for each path
    //kinda redundant for now, but will be useful for future
    paths[0].sourceAmount = paths[0].sourceAmount + temp_result.sourceAmount;
    paths[0].destinationAmount =
      paths[0].destinationAmount + temp_result.destinationAmount;
    //adding the destinationAmount
    var destinationAmount = destinationAmount + temp_result.destinationAmount;

    //recalculate each path price after executing path
    for (let g = 0; g < paths.length; g++) {
      paths[g].price = pathSend(paths[g], loopsAmount, "price");
    }
    //sort paths based on price(most destinationAmount == index 0)
    paths.sort((a, b) => a.price - b.price);
  }
  //adding leftoverto the top txDetails
  txDetails[0].sourceAmount = round(txDetails[0].sourceAmount + leftover);
  destinationAmount = round(destinationAmount);
  var profit = round(destinationAmount - normalAmount);
  console.log("Profit : " + profit);
  var pathProfit;
  var profitInXLM;
  //calculating profit from this algorithm
  if (profit <= 0) {
    profit = 0;
  }
  if (profit == 0) {
    profitInXLM = 0;
  }
  //calculating the XLM value for the profit
  else {
    try {
      var profitresp = await pathServer
        .strictSendPaths(destinationAsset, profit, [Asset.native()])
        .limit(5)
        .call();
      pathProfit = pathReqToObject(
        destinationAsset,
        Asset.native(),
        profitresp.records[0].path
      );
      profitInXLM = parseFloat(profitresp.records[0].destination_amount);
    } catch (e) {
      //if path not found
      profitInXLM = 0;
    }
  }
  //if profitInXLM < 0.2, use the horizon path to save tx fees
  if (profitInXLM < 0.2) {
    destinationAmount = normalAmount;
    profit = 0;
    profitInXLM = 0;
    txDetails = [new txInfo(sourceAmount, destinationAmount, normalPath)];
  }

  return {
    sourceAsset: sourceAsset,
    sourceAmount: sourceAmount,
    destinationAsset: destinationAsset,
    destinationAmount: destinationAmount,
    averagePrice: round(destinationAmount / sourceAmount),
    profit: profit,
    profitInXLM: profitInXLM,
    pathProfit: pathProfit,
    txDetails: txDetails,
  };
}

//function generating XDR
export async function neptunusExecute(
  sourceAsset,
  destinationAsset,
  address,
  sourceAmount,
  slippage
) {
  //slippage=decimal (5% = 0.05)
  var nept = await neptunusCalculate(
    sourceAsset,
    destinationAsset,
    sourceAmount
  );
  // Fetch the base fee and the account sequence that will create our transaction
  const [
    {
      max_fee: { mode: fee },
    },
    account,
  ] = await Promise.all([server.feeStats(), server.loadAccount(address)]);

  const transaction = new TransactionBuilder(account, {
    fee,
    networkPassphrase: Networks.PUBLIC,
  }).addMemo(new Memo(MemoText, "Neptunus"));
  //adding operations
  for (let k = 0; k < nept.txDetails.length; k++) {
    transaction.addOperation(
      Operation.pathPaymentStrictSend({
        sendAsset: nept.sourceAsset,
        sendAmount: nept.txDetails[k].sourceAmount.toString(),
        destAsset: nept.destinationAsset,
        destMin: round(
          nept.txDetails[k].destinationAmount * (1 - slippage)
        ).toString(),
        destination: address,
        path: nept.txDetails[k].path,
      })
    );
  }
  //taking profit for neptunus
  if (nept.profitInXLM != 0) {
    transaction.addOperation(
      Operation.pathPaymentStrictSend({
        sendAsset: nept.destinationAsset,
        sendAmount: round((nept.profit * neptunusFee) / 10000).toString(),
        destAsset: Asset.native(),
        destMin: "0.000001",
        destination: neptunusAddress,
        path: nept.pathProfit,
      })
    );
  }

  //taking profit for platform
  if (nept.profitInXLM > 0.04 && platformFee != 0) {
    transaction.addOperation(
      Operation.pathPaymentStrictSend({
        sendAsset: nept.destinationAsset,
        sendAmount: round((nept.profit * platformFee) / 10000).toString(),
        destAsset: Asset.native(),
        destMin: "0.000001",
        destination: neptunusAddress,
        path: nept.pathProfit,
      })
    );
  }
  //building transaction
  var resultXDR = transaction.setTimeout(TimeoutInfinite).build().toXDR();
  return resultXDR;
}
