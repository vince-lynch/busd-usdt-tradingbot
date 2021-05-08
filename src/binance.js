
//const realLength = (arr) => arr.reduce((price) => price);
const average = arr => arr.reduce( ( p, c ) => parseFloat(p) + parseFloat(c), 0 ) / arr.length;
const max = arr => Math.max(...arr);
const min = arr => Math.min(...arr);

// Globals
let askQtyNow = 0;
let bidQtyNow = 0;


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
  return new Promise(async(resolve)=> {
    binance.balance((error, balances) => {
      if ( error ) return console.error(error);
      resolve({BUSD: parseFloat(balances.BUSD.available), USDT: parseFloat(balances.USDT.available) })
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
  return new Promise(async(resolve) => {
    binance.trades("BUSDUSDT", (error, trades, symbol) => {
      console.info(symbol+" trade history", trades[0]);
      resolve(trades[trades.length - 1])
    });
  })
}

const position = {
  priceBelow: null,
  currentPosition: null,
  priceAbove: null
}

const logPosition = (priceBought) => {
  position.currentPosition = parseFloat(priceBought);
  position.priceBelow = parseFloat(((priceBought) - 0.0001).toFixed(4));
  position.priceAbove = parseFloat(priceBought) + 0.0001;
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

/**
 * Cancels any pending orders
 */
const cancelOrder = (binance, orderId) => {
  return new Promise(async(resolve) => {
    binance.cancel("BUSDUSDT",  orderId, (error, response, symbol) => {
      console.info(symbol+" cancel response:", response);
      resolve();
    });
  })
}

/**
 * Sets the sell price to be the break even price i.e. price bought in at.
 */
const setSellAtBreakEven = (binance, boughtInPrice) => {
  return new Promise(async(resolve) => {
    binance.sell("BUSDUSDT", 12, boughtInPrice, {type:'LIMIT'}, (error, response) => {
      console.log('limit sell error', error)
      console.info("Limit sell response", response);
      console.info("order id: " + response.orderId);
      resolve()
    });
  })
}

const setBuyAtNewLowest = (binance, minPrice) => {
  return new Promise(async(resolve) => {
    binance.buy("BUSDUSDT", 12, minPrice, {type:'LIMIT'}, (error, response) => {
      console.log('limit sell error', error)
      console.info("Limit sell response", response);
      console.info("order id: " + response.orderId);
      resolve()
    });
  })
}

/**
 * UpdateSellToBreakEven
 * 
 * if price moves whilst trying to sell, update sell price to break even price
 * if its bought in at 0.9988, and it sees 0.9987, it should cancel pending sell order at 0.9989, and make new sell order at 0.9988
 */
const updateSellToBreakEven = async(binance, orderId) => {
  await cancelOrder(binance,orderId);
  // not sure if maxPrice || or position.currentPosition is better level to sell
  await setSellAtBreakEven(binance, position.currentPosition);
}

const updateBuyPriceToNewLowest = async(binance, orderId, minPrice) => {
  await cancelOrder(binance,orderId);
  await setBuyAtNewLowest(binance, minPrice);
}

/**
 * createOrAdjustBuyOrder
 * 
 * We are not in the asset, so we want to buy.
 * and we don't have an open buy order open
 */
const createOrAdjustBuyOrder = async(binance, openBuyOrder, maxPrice, minPrice, lastPosition) => {
  return new Promise(async(resolve) => {
    if(
      currentPrice < 0.9996 // no buy liquidity at more than 0.9995
      && openBuyOrder == null // only buy if no buy orders open
      // no min buy price
    ){
      // never buy at 0.9996 //  must be lower.
      //const buyPrice = currentPrice - 0.0001;
      await binance.buy("BUSDUSDT", 12, minPrice, {type:'LIMIT'});
    }
    if(
        currentPrice < 0.9996 // no buy liquidity at more than 0.9995
        && openBuyOrder != null
        // no min buy price
      ){
      /**
       * if price moves whilst trying to buy, update buy price to new lowest price
       * if max price, is two ticks higher than where we want to buy in.. then adjust to 1 below.
       * if min price is anywhere beneath where we are trying to buy in, then adjust to min price.
       */
      if(maxPrice > parseFloat(openBuyOrder.price) + 0.0001 || minPrice < parseFloat(openBuyOrder.price)){
        await updateBuyPriceToNewLowest(binance, openBuyOrder.orderId, maxPrice, minPrice);
      }
    }
    resolve();
  })
}


/**
 * createOrAdjustSellOrder
 * my last buy in (trade), must be relevant because I am in the asset.
 * and i've either already placed the sell limit order
 */
const createOrAdjustSellOrder = async(binance, openSellOrder, minPrice, maxPrice, lastPosition) => {
  return new Promise(async(resolve) => {
    if(openSellOrder != null){
      // Usually just wait for the sell order to go through.
      // In some cases we might want to sell for what the current price is,
      // i.e. incase it drops to the price beneath, 
  
      /**
       * if price moves whilst trying to sell, update sell price to break even price
       * if its bought in at 0.9988, and it sees 0.9987, it should cancel pending sell order at 0.9989, and make new sell order at 0.9988
       */
      if(minPrice < lastPosition.priceBelow){
        await updateSellToBreakEven(binance, openSellOrder.orderId, lastPosition.currentPosition); // not sure if maxPrice ||
      }
    } else {
      // or I need to place the sell limit order
      // Sell at 1 above where you bought.
      //const priceToSell = parseFloat(price) + 0.0001;
      const highestNumber = Math.max(lastPosition.priceAbove, maxPrice);

      await binance.sell("BUSDUSDT", 12, highestNumber, {type:'LIMIT'});
    }
    resolve();
  })
}

let openOrders = {
  BUY: null,
  SELL: null
}

const getOpenOrders = (binance) => {
  return new Promise(async(resolve) => {
    //
    // need a way of clearing out orders that have gone through
    //
    var isBuyOrders = false;
    var isSellOrders = false;

    binance.openOrders("BUSDUSDT", (error, orders, symbol) => {

      orders.forEach(({ side, price, time, orderId }) => {
        var qtyBeforeYou = side == 'SELL' ? askQtyNow : bidQtyNow;
        var secsUntil = qtyBeforeYou / (last30SecsQuantity / 30);

        /**
         * Need this to clear out 'gone' orders
         */
        if(side == 'BUY'){
          isBuyOrders = true;
        }
        if(side == 'SELL'){
          isSellOrders = true;
        }

        /**
         * If no open order for that side
         * or orderId for that side is (old?)
         * then update our openOrders with these details
         */
        if(openOrders[side] == null || openOrders[side].orderId != orderId){
          openOrders[side] = {
            qtyBeforeYou,
            secsUntil, // probably wrong because if less ask quantity than bid quantity then.. or, vice versa. your just taking amount per second
            time,
            expectedTime: time + (secsUntil * 1000), // unix,
            price: parseFloat(price),
            orderId
          }
        }
        if(openOrders[side].orderId == orderId){
          openOrders[side].secsLeft = (openOrders[side].expectedTime - Date.now()) / 1000;
        }
      })
      // a way to clear out 'gone' orders
      if(isBuyOrders == false){
        openOrders['BUY'] = null;
      }
      if(isSellOrders == false){
        openOrders['SELL'] = null;
      }
      console.log('currently openOrders: ', openOrders);
      resolve(openOrders)
    })
  })
}

const getLastPosition = async(binance) => {
  return new Promise(async(resolve) => {
    const lastTrade = await getLastTrade(binance);
    if(lastTrade.isBuyer){
      logPosition(parseFloat(lastTrade.price))
      resolve(position);
    }
    resolve(position);
  })
}

const doStuff = async(binance, { maxPrice, minPrice, averagePrice, lastPrice }) => {
  const lastPosition =  await getLastPosition(binance);
  //getBalance(binance).then(async({ BUSD, USDT }) => {
  //  console.info("BUSD balance: ", BUSD);
  //  console.info("USDT balance: ", USDT);

  const { BUY: openBuyOrder, SELL: openSellOrder } = await getOpenOrders(binance);
  console.log('here')
  //const { price, qty } = await getLastTrade(binance);
  /**
   * In an order
   */
  //if(BUSD < 1){
    // We are not in the asset, so we want to buy.
    // and we don't have an open buy order open
  
  //await createOrAdjustBuyOrder(binance, openBuyOrder, maxPrice, minPrice, lastPosition);

  // else {}
  // my last buy in (trade), must be relevant because I am in the asset.
  // and i've either already placed the sell limit order
  
  //await createOrAdjustSellOrder(binance, openSellOrder, minPrice, maxPrice, lastPosition);

//});
}

let tradeQuantities = [];
let last30SecsQuantity = 0;

const getTradeQuantities = () => {
  var totalTraded = tradeQuantities.reduce((a, b) => a + b, 0);
  tradeQuantities = []; // reset array.
  last30SecsQuantity = totalTraded;
  return totalTraded;
}

const startTradesListener = (binance) => {
  binance.websockets.trades(['BUSDUSDT'], (trades) => {
    let {e:eventType, E:eventTime, s:symbol, p:price, q:quantity, m:maker, a:tradeId} = trades;

    //console.log('price', price, 'quantity', quantity);
    dataSoFar.shift() // remove first price
    dataSoFar.push(price) // add a price
    currentPrice = parseFloat(price);
    //
    tradeQuantities.push(parseFloat(quantity));
  });
}



const cancelAllOpenOrders = (binance) => {
  return new Promise(async(resolve) => {
    const { openBuyOrders, openSellOrders } = await getOpenOrders(binance);
    // needs rethinking as not syncronous
    openBuyOrders.forEach((order) => {
      cancelOrder(binance, order.orderId);
    })
    openSellOrders.forEach((order) => {
      // needs rethinking as not syncronous
      cancelOrder(binance, order.orderId);
    })
    resolve()
  })
}


const startOrderBookListener = (binance) => {
  binance.websockets.depth(['BUSDUSDT'], ({ a, b }) => {
    let ask = { price: parseFloat(a[0][0]), total: parseFloat(a[0][1]) };
    let bid = { price: parseFloat(b[0][0]), total: parseFloat(b[0][1]) };

    askQtyNow = ask.total;
    bidQtyNow = bid.total;

    if(askQtyNow > bidQtyNow){ 
      console.log('price is moving down');
      // buy orders placed now should fill sooner than sell orders
    } else {
      console.log('price is moving up');
      // sell orders placed now should fill sooner than buy orders
    }
    //console.info("last updated: " + new Date(depth.eventTime));
  });
}

const startTerminalChart = async(binance) => {
  startTradesListener(binance);
  startOrderBookListener(binance);
  //
  // Cancel open orders on load -- price has probably changed.
  //await cancelAllOpenOrders(binance);
  // Need to write logic to determine position if already in asset when
  // when the software loads..
  const positionNow = await getLastPosition(binance)
  console.log('currentPosition: ', positionNow);
  //
  setInterval(async() => {
    console.log('in the last 30 seconds, quantity traded: ', getTradeQuantities());

    // get prices so we can decide on how to trade
    const { maxPrice, minPrice, averagePrice, lastPrice } = priceRange();
    console.log('currentPosition:', position);

    doStuff(binance, { maxPrice, minPrice, averagePrice, lastPrice })
  }, 30 * 1000);
}


export { startTerminalChart }
