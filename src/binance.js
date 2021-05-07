
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

const getOpenOrders = (binance) => {
  return new Promise((resolve) => {
    binance.openOrders("BUSDUSDT", (error, orders, symbol) => {
      const openSellOrders = orders.filter((order)=> order.side == 'SELL');
      const openBuyOrders = orders.filter((order)=> order.side == 'BUY');
      resolve({ openBuyOrders, openSellOrders })
    });
  })
}

const position = {
  priceBelow: null,
  currentPosition: null,
  priceAbove: null
}

const logPosition = (priceBought) => {
  position.currentPosition = priceBought;
  position.priceBelow = priceBought - 0.0001;
  position.priceAbove = priceBought + 0.0001;
  console.log('updated position, buy complete: ', position);
}

const clearPosition = () => {
  position.currentPosition = null;
  position.priceBelow = null;
  position.priceAbove = null;
  console.log('cleared position, sell complete: ', position);
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

const cancelAllOrders = (binance, orderId) => {
  return new Promise((resolve) => {
    binance.cancel("BUSDUSDT",  orderId, (error, response, symbol) => {
      console.info(symbol+" cancel response:", response);
      resolve();
    });
  })
}


const setSellAtBreakEven = (binance, boughtInPrice) => {
  binance.sell("BUSDUSDT", 12, boughtInPrice, {type:'LIMIT'}, (error, response) => {
    console.log('limit sell error', error)
    console.info("Limit sell response", response);
    console.info("order id: " + response.orderId);
  });
}

/**
 * UpdateSellToBreakEven
 * 
 * Cancel sell order
 * if its bought in at 0.9988, and it sees 0.9987, it should cancel pending sell order at 0.9989, and make new sell order at 0.9988
 */
const updateSellToBreakEven = async(binance, orderId) => {
  await cancelAllOrders(binance,orderId);
  await setSellAtBreakEven(binance, position.currentPosition);
}


const doStuff = async(binance, { maxPrice, minPrice, averagePrice, lastPrice }) => {
  getBalance(binance).then(async({ BUSD, USDT }) => {
    console.info("BUSD balance: ", BUSD);
    console.info("USDT balance: ", USDT);

    const { openBuyOrders, openSellOrders } = await getOpenOrders(binance);
    //const { price, qty } = await getLastTrade(binance);


    /**
     * In an order
     */
    if(BUSD > 1){
      // my last buy in (trade), must be relevant because I am in the asset.
      // and i've either already placed the sell limit order
      if(openSellOrders.length){
        // Usually just wait for the sell order to go through.
        // In some cases we might want to sell for what the current price is,
        // i.e. incase it drops to the price beneath, 

        /**
         * Cancel sell order
         * if its bought in at 0.9988, and it sees 0.9987, it should cancel pending sell order at 0.9989, and make new sell order at 0.9988
         */
        if(minPrice < position.priceBelow){
          await updateSellToBreakEven(binance, openSellOrders[0].orderId);
        }

      } else {
        // or I need to place the sell limit order
        // Sell at 1 above where you bought.
        //const priceToSell = parseFloat(price) + 0.0001;
        binance.sell("BUSDUSDT", 12, maxPrice, {type:'LIMIT'}, (error, response) => {
          console.log('limit sell error', error)
          console.info("Limit sell response", response);
          console.info("order id: " + response.orderId);
          // position isn't cleared until sell order limit has been filled
          //clearPosition();
        });
      }
    } else {
      // We are not in the asset, so we want to buy.
      // and we don't have an open buy order open
      if(
          currentPrice < 0.9996 // no buy liquidity at more than 0.9995
          && openBuyOrders.length == 0 // only buy if no buy orders open
          && currentPrice > 0.9987 // no sell liquidity at less than 9987
        ){ 
          // never buy at 0.9996 //  must be lower.
          //const buyPrice = currentPrice - 0.0001;
          binance.buy("BUSDUSDT", 12, minPrice, {type:'LIMIT'});
          logPosition(minPrice);
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
    // Need to write logic to determine position if already in asset when
    // when the software loads..
    console.log('currentPosition: ', position);

    doStuff(binance, { maxPrice, minPrice, averagePrice, lastPrice })
  }, 30 * 1000);
}


export { startTerminalChart }
