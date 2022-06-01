const {Server, Asset, LiquidityPoolAsset, LiquidityPoolFeeV18, getLiquidityPoolId, Networks, TransactionBuilder, Operation, MemoText, TimeoutInfinite, Memo} = require('stellar-sdk');


const pathServer = new Server("https://horizon.stellar.org"); //pathfinder horizon instance
const server = new Server("https://horizon.stellar.org"); 


//fee are in bps/0.01% of profit
const neptunusFee = 800;   //8% of profit
const platformFee = 200;   //2% of profit
const neptunusAddress = 'GAM6VCFJLV4FMUTRXSWNK7OMWBXLNOIHHGGM25LOPF36UP7UZ47MNPTN';
const platformAddress = neptunusAddress;

//for storing path details
let Pathing = class {
    constructor(path ,price){
        this.path=path;
        this.price=price;
        this.sourceAmount=0;
        this.destinationAmount=0;
    }
}

//for storing market(ob & lp) details
let MarketDetails = class {
    constructor(assetA, assetB, obDetails, lpDetails){
        this.assetA=assetA;
        this.assetB=assetB;
        this.obDetails=obDetails;
        this.lpDetails=lpDetails;
    }
}

//for storing operation details
let txInfo = class {
    constructor(sourceAmount, destinationAmount, path){
        this.sourceAmount=sourceAmount,
        this.destinationAmount=destinationAmount,
        this.path=path
    }
}

//converting horizon request into array of assets(for transaction)
function pathReqToObject(sourceAsset, destinationAsset, path){
    path_temp=[sourceAsset];
    for (let j=0;j<path.length;j++){
        if (path[j].asset_type=='native'){
            temp_asset= new Asset('XLM');
            path_temp.push(temp_asset);
        }
        else{
            temp_asset= new Asset(path[j].asset_code, path[j].asset_issuer);
            path_temp.push(temp_asset);
        }
    }
    path_temp.push(destinationAsset);
    return path_temp;
}

//round to the 7th decimal for building operations/transaction
function round(num){
    return (Math.floor(num*10000000)/10000000);
}


//ordering asset by lexicographic order
function orderAssets(A, B) {
    return (Asset.compare(A, B) <= 0) ? [A, B] : [B, A];
}

//fetching orderbook state (ordered by lexicographical order)
async function fetchOrderbook(assetA, assetB){
    orderedAsset=orderAssets(assetA, assetB); //ordering asset by lexicographical order
    return await server.orderbook(orderedAsset[0], orderedAsset[1]).limit(200).call();  
}

//fetching liquiditypool state
async function fetchLiqpool(assetA, assetB){
    orderedAsset=orderAssets(assetA, assetB);
    lp = new LiquidityPoolAsset(orderedAsset[0], orderedAsset[1], LiquidityPoolFeeV18);
    poolId=getLiquidityPoolId("constant_product", lp.getLiquidityPoolParameters()).toString('hex');
    try{
        return await server.liquidityPools().liquidityPoolId(poolId).call();
    }
    catch(e){
        return 0;
    }
    
}
//fetching market detail(lp & ob)
async function fetchMarket(assetA, assetB){
    let promise_temp=[fetchOrderbook(assetA,assetB), fetchLiqpool(assetA,assetB)];
    let promise_res= await Promise.all(promise_temp);
    temp_ob=promise_res[0];
    temp_lp=promise_res[1];
    temp_market=new MarketDetails(
        assetA,
        assetB,
        temp_ob,
        temp_lp
    )
    market.push(temp_market);
}

//simulating liquidity pool execution
function liqpoolSend(sourceAsset, destinationAsset, lpDetails, sourceAmount, type){
    //type execute -> return modified lpDetails
    //type calc -> return destinationAmount
    balance = [0,0]

    //substract liquiditypool fee (0.3% fee)
    sourceAmount=round(sourceAmount*0.997)
    //sourceAmount=round(sourceAmount*0.997);
    //if there's no lp
    if (lpDetails==0){
        return 0;
    }

    //cloning the lpDetails so any modification to it doesn't effect the original lpDetails 
    modifiedLp=JSON.parse(JSON.stringify(lpDetails));

    //getting the pool balance + product
    balance[0]= parseFloat(modifiedLp.reserves[0].amount)
    balance[1]= parseFloat(modifiedLp.reserves[1].amount)
    poolProduct = balance[0] * balance[1];
    //onsole.log(Number.isSafeInteger(poolProduct));

    //ordering the assets
    temps=orderAssets(sourceAsset, destinationAsset);
    
    sent=0;
    received=1;
    
    if(Asset.compare(sourceAsset, temps[1])==0){
        sent=1;
        received=0;
    }


    //clculating the lp trade
    balance[sent] = balance[sent] + sourceAmount;
    z = poolProduct / balance[sent];
    destinationAmount = round(balance[received] - z);
    balance[received] = round(balance[received]-destinationAmount);
    modifiedLp.reserves[sent].amount = balance[sent].toString();
    modifiedLp.reserves[received].amount = balance[received].toString();
    if(type=='calc'){
        return destinationAmount;
    }
    else if (type=='execute'){
        return modifiedLp;
    }
}
//simulating orderbook execution
function orderbookSend(sourceAsset, destinationAsset, obDetails, sourceAmount, type){
    //type execute -> return modified lpDetails
    //type calc -> return destinationAmount
    modifiedOb=JSON.parse(JSON.stringify(obDetails));
    temps=orderAssets(sourceAsset, destinationAsset);
    offerType='bids';
    if(Asset.compare(sourceAsset, temps[1])==0){
        offerType='asks';
    }
    depth=0;
    destinationAmount=0;

    while(sourceAmount>=0){
        try{
            price = parseFloat(modifiedOb[offerType][0].price_r.n)/parseFloat(modifiedOb[offerType][0].price_r.d);
        }
        catch(e){
            if(type == 'calc'){
                return round(sourceAmount);
            }
            if(type == 'execute'){
                return modifiedOb;
            }
        }
        if(Asset.compare(sourceAsset, temps[1])==0){
            price=1/price;
        }
        amount = parseFloat(modifiedOb[offerType][0].amount);
        depth = round(1/price * amount)
        if(sourceAmount >= depth){
            destinationAmount = round(sourceAmount + amount);
            sourceAmount = round(sourceAmount - depth);
            modifiedOb[offerType].shift();
            if (sourceAmount <= 0){
                if(type == 'calc'){
                    return round(sourceAmount);
                }
                if(type == 'execute'){
                    return modifiedOb;
                }
            }
        }
        else if(sourceAmount < depth){
            marginalDestinationAmount = sourceAmount / depth * amount;
            destinationAmount = round(destinationAmount+marginalDestinationAmount);
            modifiedOb[offerType][0].amount = round(amount - marginalDestinationAmount).toString();
            sourceAmount = 0;
            if(type == 'calc'){
                return round(sourceAmount);
            }
            if(type == 'execute'){
                return modifiedOb;
            }
        }
    }
}

//simulating path payment
function pathSend(path, sourceAmount,type){
    //type execute -> return diting the lp and ob, return list : result[0]=source_amount ; result[1]=destination_amount
    //type calcPrice -> price
    //type calc -> receivedAmount
    sentAmount=sourceAmount;
    for(let i =0;i<path.path.length-1;i++){
        temps=orderAssets(path.path[i], path.path[i+1]);
        //console.log(market);
        for (let j=0;j<market.length;j++){
            if(Asset.compare(market[j].assetA, temps[0])==0 && Asset.compare(market[j].assetB, temps[1])==0){
                ob_details=market[j].obDetails;
                lp_details=market[j].lpDetails;
                marketIndex=j;
                break;
            }
        }
        receivedOb=orderbookSend(
            path.path[i],
            path.path[i+1],
            ob_details,
            sentAmount,
            'calc'
        );

        receivedLp=liqpoolSend(
            path.path[i],
            path.path[i+1],
            lp_details,
            sentAmount,
            'calc'
        );
        receivedPath=Math.max(receivedLp, receivedOb);
        if(type=='execute'){
            if(receivedLp>=receivedOb){
                market[marketIndex].lpDetails=liqpoolSend(
                    path.path[i],
                    path.path[i+1],
                    lp_details,
                    sentAmount,
                    'execute'
                );
            }
            else if(receivedLp<receivedOb){
                market[marketIndex].obDetails=orderbookSend(
                    path.path[i],
                    path.path[i+1],
                    ob_details,
                    sentAmount,
                    'execute'
                );
            }
        }
        sentAmount=receivedPath;
    }
    price=sourceAmount/receivedPath;
    //console.log(receivedPath, path.path);
    if(type=='calc'){
        return round(receivedPath);
    }
    else if(type=='price'){
        
        return price;
    }
    else if(type=='execute'){
        return {
            sourceAmount: sourceAmount,
            destinationAmount: round(receivedPath),
            price: price
        }
    }



}

//replacing horizon(they only return 1 path after the update)🥺
async function router(sourceAsset, destinationAsset){
    aqua= new Asset('AQUA', 'GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA');
    xlm=new Asset('XLM');
    usdc=new Asset('USDC', 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN');
    return [
        [sourceAsset, destinationAsset],
        [sourceAsset, xlm, destinationAsset],
        [sourceAsset, aqua,  destinationAsset],
        [sourceAsset, usdc, destinationAsset],
        [sourceAsset, xlm, usdc, destinationAsset],
        [sourceAsset, xlm, aqua, destinationAsset],
        [sourceAsset, aqua, xlm, destinationAsset],
        [sourceAsset, aqua, xlm, destinationAsset],
        [sourceAsset, usdc, xlm, destinationAsset],
        [sourceAsset, usdc, aqua, destinationAsset],
    ];
}

//checking for duplicate/invalid path from router()
//didn't check for duplicate path because it doesn't matter
async function checkpath(_pathList){
    var _result=[];
    for(let i=0;i<_pathList.length;i++){
        _path=_pathList[i]
        isDuplicate=false;
        for(let j=0;j<_path.length-1;j++){
            if(Asset.compare(_path[0], _path[j])==0 && j!=0){
                isDuplicate=true;
            }
            if(Asset.compare(_path[_path.length-1], _path[j])==0 && j!=_path.length-1){
                isDuplicate=true;
            }
            if(Asset.compare(_path[j], _path[j+1])==0){
                _path.splice(j, 1);
                j--;
            }
        }
        if(isDuplicate==false){
            _result.push(_path);
        }
    }    
    return _result;
}

//external function
async function  neptunusCalculate(sourceAsset, destinationAsset, sourceAmount){
    //fetching path and parsing it
    pathResponse=await pathServer.strictSendPaths(sourceAsset, sourceAmount.toString(), [destinationAsset]).limit(5).call();
    pathsList=pathResponse.records;
    normalAmount=parseFloat(pathsList[0].destination_amount);
    destinationAmount=0;
    pairsList=[];
    market=[];
    paths=[];
    txDetails=[];
    /*shitty Edgecase :
        Small source amount ==> Low Valued token -> High Valued Token (e.g 1 AQUA -> BTC), loopAmount become so small that it yields 0 output after function.
        Very Small source amount ==> 0.000001 XXX -> YYY, loopAmount = 0;
        

        Solution :
            >Compare the result to normal path payment
            >If Normal Path Payment yield more result, use normal path payment
    
    */
    loops=20;
    loopsAmount=round(sourceAmount/loops);
    leftover=sourceAmount-loopsAmount*loops; //rounding error

    //same as pathreq to obj but it also process amount
    for (let i=0;i<pathsList.length;i++){
        path_temp=[sourceAsset];
        for (let j=0;j<pathsList[i].path.length;j++){
            if (pathsList[i].path[j].asset_type=='native'){
                temp_asset= new Asset('XLM');
                path_temp.push(temp_asset);
            }
            else{
                temp_asset= new Asset(pathsList[i].path[j].asset_code, pathsList[i].path[j].asset_issuer);
                path_temp.push(temp_asset);
            }
        }
        path_temp.push(destinationAsset);
        temp_price = parseFloat(pathsList[i].destination_amount) / parseFloat(pathsList[i].source_amount)
        temps = new Pathing(path_temp, temp_price);
        paths.push(temps);
    }
    pathz=await checkpath(await router(sourceAsset, destinationAsset));
    for(let i=0;i<pathz.length;i++){
        temps= new Pathing(pathz[i], 0);
        paths.push(temps);
    }
    //console.log(paths);
    //console.log(paths[0].path)
    normalPath=paths[0].path;
    //fetching market details
    promiseMarket=[];
    for(let i=0;i<paths.length;i++){
        //console.log(paths[i]);
        for(let j=0;j<paths[i].path.length-1;j++){
            temp_assets=orderAssets(paths[i].path[j], paths[i].path[j+1]);
            
            marketDuplicate=false;
            for(let k=0; k<pairsList.length; k++){
                if(pairsList[k][0]==temp_assets[0] && pairsList[k][1]==temp_assets[1]){
                    marketDuplicate=true;
                    break;
                }
            }
            if (marketDuplicate==true){
                continue;
            }
            pairsList.push(temp_assets);
            promiseMarket.push(fetchMarket(temp_assets[0], temp_assets[1]));
        }
    }
    promiseMarketResult = await Promise.all(promiseMarket);
    var destinationAmount;
    for(let h=0;h<loops;h++){
        temp_result=pathSend(
            paths[0],
            loopsAmount,
            'execute'
        );
        temp_info=new txInfo(
            temp_result.sourceAmount,
            temp_result.destinationAmount,
            paths[0].path
        )
        txDetails.push(temp_info);
        paths[0].sourceAmount = paths[0].sourceAmount +  temp_result.sourceAmount;
        paths[0].destinationAmount = paths[0].destinationAmount + temp_result.destinationAmount;
        destinationAmount = destinationAmount + temp_result.destinationAmount;
        for (let g=0;g<paths.length;g++){
            paths[g].price=pathSend(
                paths[g],
                loopsAmount,
                'price'
            );
        }
        paths.sort((a, b) => a.price - b.price);
    }  
    txDetails[0].sourceAmount = round(txDetails[0].sourceAmount + leftover);
    destinationAmount = round(destinationAmount);
    console.log(paths);
    console.log(destinationAmount);
    profit = round(destinationAmount-normalAmount);
    var pathProfit;
    if (profit <= 0){
        profit = 0;
    }
    if(profit==0){
        profitInXLM=0;
    }
    else{
        //console.log(profitresp);
        try{
            profitresp = await pathServer.strictSendPaths(destinationAsset, profit, [Asset.native()]).limit(5).call()
            pathProfit=pathReqToObject(destinationAsset, Asset.native(), profitresp.records[0].path);
            profitInXLM = parseFloat(profitresp.records[0].destination_amount);
        }
        catch(e){
            profitInXLM = 0;
        }
    }
    
    if(profitInXLM<0.002){
        destinationAmount=normalAmount;
        profit=0;
        profitInXLM=0;
        txDetails = [new txInfo(sourceAmount, destinationAmount, normalPath)];
    }

    return {
        sourceAsset: sourceAsset,
        sourceAmount: sourceAmount,
        destinationAsset: destinationAsset,
        destinationAmount: destinationAmount,
        averagePrice: round(destinationAmount/sourceAmount),
        profit: profit,
        profitInXLM: profitInXLM,
        pathProfit: pathProfit,
        txDetails: txDetails
    }
}

async function neptunusExecute(sourceAsset, destinationAsset, address, sourceAmount, slippage){
    //slippage=decimal (5% = 0.05)
    nept= await neptunusCalculate(sourceAsset, destinationAsset, sourceAmount);
    // Fetch the base fee and the account that will create our transaction
    const [
        {
          max_fee: { mode: fee },
        },
        account,
      ] = await Promise.all([
        server.feeStats(),
        server.loadAccount(address),
      ]);
    const transaction = new TransactionBuilder(account, {
        fee,
        networkPassphrase: Networks.PUBLIC,
    })
    .addMemo(new Memo(MemoText, "Neptunus"));
    for(let k=0;k<nept.txDetails.length;k++){
      transaction.addOperation(Operation.pathPaymentStrictSend({
          sendAsset: nept.sourceAsset,
          sendAmount: nept.txDetails[k].sourceAmount.toString(),
          destAsset: nept.destinationAsset,
          destMin: round(nept.txDetails[k].destinationAmount*(1-slippage)).toString(),
          destination: address,
          path: nept.txDetails[k].path
      }))
    }
    //take profit neptunus
    if(nept.profitInXLM > 0.04){
        transaction.addOperation(Operation.pathPaymentStrictSend({
            sendAsset: nept.destinationAsset,
            sendAmount: round(nept.profit*neptunusFee/10000).toString(),
            destAsset: Asset.native(),
            destMin: "0.000001",
            destination: neptunusAddress,
            path: nept.pathProfit
        }))
    }
    //take profit platform
    if(nept.profitInXLM > 0.04 && platformFee!=0){
        transaction.addOperation(Operation.pathPaymentStrictSend({
            sendAsset: nept.destinationAsset,
            sendAmount: round(nept.profit*platformFee/10000).toString(),
            destAsset: Asset.native(),
            destMin: "0.000001",
            destination: neptunusAddress,
            path: nept.pathProfit
        }))
    }
    resultXDR = transaction.setTimeout(TimeoutInfinite).build().toXDR();
    //console.log(resultXDR);
    return resultXDR;
}
