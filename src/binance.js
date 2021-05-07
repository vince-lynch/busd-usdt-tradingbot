
//const realLength = (arr) => arr.reduce((price) => price);
const average = arr => arr.reduce( ( p, c ) => parseFloat(p) + parseFloat(c), 0 ) / arr.length;
const max = arr => Math.max(...arr);
const min = arr => Math.min(...arr);


// never buy at 0.9996 //  must be lower.

// never sell at 0.9986 // no liquidity.





// binance.trades("BUSDUSDT", (error, trades, symbol) => {
//     console.info(symbol+" trade history", trades);
// });

// let quantity = 11, price = 0.069;
// binance.buy("BUSDUSDT", quantity, price);
// binance.sell("BUSDUSDT", quantity, price);

//let quantity = 11, price = 0.9986;
// binance.buy("BUSDUSDT", quantity, price, {type:'LIMIT'}, (error, response) => {
//   console.info("Limit Buy response", response);
//   console.info("order id: " + response.orderId);
// });

// binance.cancel("BUSDUSDT", orderid, (error, response, symbol) => {
//     console.info(symbol+" cancel response:", response);
//   });


// AlWAYS HAVE 1 order or 1 trade placed (not both)



const orderOrTrade = [];


//console.info( await binance.cancelAll("BUSDUSDT") );
const getBalance = (binance) => {
  return new Promise((resolve)=> {
    binance.balance((error, balances) => {
      if ( error ) return console.error(error);
      resolve({BUSD: balances.BUSD.available, USDT: balances.USDT.available })
    })
  });
}

// binance.openOrders("BUSDUSDT", (error, openOrders, symbol) => {
//   console.info("openOrders("+symbol+")", openOrders);
// });
// binance.trades("BUSDUSDT", (error, trades, symbol) => {
//     console.info(symbol+" trade history", trades);
// });

const getLastTrade = (binance) => {
  return new Promise((resolve) => {
    binance.trades("BUSDUSDT", (error, trades, symbol) => {
      console.info(symbol+" trade history", trades[0]);
      resolve(trades[0])
    });
  })
}

const getOpenBuyOrders = (binance) => {
  return new Promise((resolve) => {
    binance.openOrders("BUSDUSDT", (error, openOrders, symbol) => {
      const buyOrders = openOrders.filter((order)=> order.side == 'BUY');
      if(buyOrders.length){
        let openBuyPrice = buyOrders[0].price;
        resolve({ isOpenBuy: true, openBuyPrice });
      } else {
        resolve({ isOpenBuy: false, openBuyPrice: 0 });
      }
    });
  })
}

const getOpenSellOrders = (binance) => {
  return new Promise((resolve) => {
    binance.openOrders("BUSDUSDT", (error, openOrders, symbol) => {
      const sellOrders = openOrders.filter((order)=> order.side == 'SELL');
      if(sellOrders.length){
        let openSellPrice = sellOrders[0].price;
        resolve({ isOpenSell: true, openSellPrice });
      } else {
        resolve({ isOpenSell: false, openSellPrice: 0 });
      }
    });
  })
}

const threePrices = {
  priceBelow: 0,
  priceBought: 0,
  priceAbove: 0
}

let currentPrice = 0.9989;



let dataLimit = 120;
let dataSoFar = new Array(dataLimit)

const priceRange = () => {
  return { 
    maxPrice: max(dataSoFar), 
    minPrice: min(dataSoFar), 
    averagePrice: average(dataSoFar), 
    lastPrice: parseFloat(dataSoFar[dataSoFar.length -1])
  };
}


const doStuff = async(binance, { maxPrice, minPrice, averagePrice, lastPrice }) => {
  getBalance(binance).then(async({ BUSD, USDT }) => {
    console.info("BUSD balance: ", BUSD);
    console.info("USDT balance: ", USDT);
    /**
     * In an order
     */
    if(BUSD > 1){
      // my last buy in (trade), must be relevant because I am in the asset.
      const { price, qty } = await getLastTrade(binance);
      const { isOpenSell, openSellPrice } = await getOpenSellOrders(binance);
      
      // and i've either already placed the sell limit order
      if(isOpenSell){
        // Usually just wait for the sell order to go through.
        // In some cases we might want to sell for what the current price is,
        // i.e. incase it drops to the price beneath, 
      } else {
        // or I need to place the sell limit order
        // Sell at 1 above where you bought.
        //const priceToSell = parseFloat(price) + 0.0001;
        binance.sell("BUSDUSDT", 12, maxPrice, {type:'LIMIT'}, (error, response) => {
          console.log('limit sell error', error)
          console.info("Limit sell response", response);
          console.info("order id: " + response.orderId);
        });
      }
    } else {
      // We are not in the asset, so we want to buy.
      const { isOpenBuy, openBuyPrice } = await getOpenBuyOrders(binance)
      // and we don't have an open buy order open
      if(
        currentPrice < 0.9996 // no buy liquidity at more than 0.9995
        && isOpenBuy == false 
        && currentPrice > 0.9987 // no sell liquidity at less than 9987
        ){ 
        // never buy at 0.9996 //  must be lower.
        //const buyPrice = currentPrice - 0.0001;
        binance.buy("BUSDUSDT", 12, minPrice, {type:'LIMIT'});
      }
    }
  });
}



const startTradesListener = (binance) => {
  binance.websockets.trades(['BUSDUSDT'], (trades) => {
    let {e:eventType, E:eventTime, s:symbol, p:price, q:quantity, m:maker, a:tradeId} = trades;

    //console.log('price', price, 'quantity', quantity);
    dataSoFar.shift() // remove first price
    dataSoFar.push(price) // add a price
    currentPrice = price;
  });
}


const startTerminalChart = (binance) => {
  startTradesListener(binance);
  //
  setInterval(() => {
    // get prices so we can decide on how to trade
    const { maxPrice, minPrice, averagePrice, lastPrice } = priceRange();
    doStuff(binance, { maxPrice, minPrice, averagePrice, lastPrice })
  }, 30 * 1000);
}


export { startTerminalChart }
