import { cancelOrder, cancelOrderMargin } from './cancel.js';
import { position } from '../position/index.js';

/**
 * Sets the sell price to be the break even price i.e. price bought in at.
 */
const setSellAtBreakEven = (binance, boughtInPrice) => {
  return new Promise(async (resolve) => {
    binance.sell("BUSDUSDT", 12, boughtInPrice, {
      type: 'LIMIT'
    }, (error, response) => {
      console.log('limit sell error', error)
      console.info("Limit sell response", response);
      console.info("order id: " + response.orderId);
      resolve()
    });
  })
}

const setSellAtBreakEvenMargin = (binance, boughtInPrice) => {
  let amount = 12;
  return new Promise((resolve) => {
    binance.mgOrder('SELL', 'BUSDUSDT', amount, boughtInPrice, {
      isIsolated: false,
      timeInForce: 'GTC'
    }, ((error, response) => {
      if (error) 
        return console.warn(error);
      console.info("crossmargin buy response:", response);
      resolve(response);
    }));
  })
}

/**
* UpdateSellToBreakEven
* 
* if price moves whilst trying to sell, update sell price to break even price
* if its bought in at 0.9988, and it sees 0.9987, it should cancel pending sell order at 0.9989, and make new sell order at 0.9988
*/
const updateSellToBreakEven = async (binance, openSellOrder) => {
  await cancelOrder(binance, openSellOrder.orderId);
  await setSellAtBreakEven(binance, position.currentPosition);
}


const updateSellOrderMargin = async(binance, openSellOrder, maxPrice)=> {
  await cancelOrderMargin(binance, openSellOrder.orderId);
  await setSellAtBreakEvenMargin(binance, maxPrice);
}

/**
 * If already in BSUD, 
 * and does not have an open sell order.
 * .. then look to open a sell order
 * if we have a sell order open, then maybe adjust
 * if we can no longer sell at that price.
*/
const checkForSell = (binance, openSellOrders, openBuyOrders, {
  BUSD
}, {maxPrice}) => {
  return new Promise(async (resolve) => {
    if (BUSD > 2 || openSellOrders.length) {
      // my last buy in (trade), must be relevant because I am in the asset.
      // and i've either already placed the sell limit order
      if (openSellOrders.length) {
        // Usually just wait for the sell order to go through.
        // In some cases we might want to sell for what the current price is,
        // i.e. incase it drops to the price beneath,
        if (openBuyOrders.length == 0) { /**
          * if price moves whilst trying to sell, update sell price to break even price
          * if its bought in at 0.9988, and it sees 0.9987, it should cancel pending sell order at 0.9989, and make new sell order at 0.9988
          */
          if (maxPrice <= position.currentPosition) { // if there is no opportunity to sell at the price above our buy-in price anymore, then
            if (parseFloat(openSellOrders[0].price) != position.currentPosition) { /**
              * we are only adjusting our sell position - to break even - if we haven't already got
              * a sell order placed at our break even price
              */
              await updateSellToBreakEven(binance, openSellOrders[0]);
            }
          }
        }

      } else {
        // or I need to place the sell limit order
        // Sell at 1 above where you bought.
        // const priceToSell = parseFloat(price) + 0.0001;
        if (openBuyOrders.length == 0) {
          binance.sell("BUSDUSDT", 12, maxPrice, {
            type: 'LIMIT'
          }, (error, response) => {
            console.log('limit sell error', error)
            console.info("Limit sell response", response);
            console.info("order id: " + response.orderId);
            // position isn't cleared until sell order limit has been filled
            // clearPosition();
          });
        }
      }
    }
    resolve();
  })
}

const placeCrossMarginSell = (binance, amount = 12, maxPrice) => {
  return new Promise((resolve)=> {
    binance.mgOrder('SELL', 'BUSDUSDT', amount, maxPrice, {
      isIsolated: false,
      timeInForce: 'GTC'
    }, ((error, response) => {
      if (error) 
        return console.warn(error);
      console.info("crossmargin SELL response:", response);
      resolve(response);
    }));
  })
}

const checkForSellMargin = (binance, openSellOrders, openBuyOrders, {
  BUSD
}, {maxPrice}) => {
  return new Promise(async (resolve) => {
    if (BUSD > 2 || openSellOrders.length) {
      if (openSellOrders.length) {
        if (openBuyOrders.length == 0) {
          /**
           * If max price has changed, update sell order to get the max price
           */
          if (parseFloat(openSellOrders[0].price) != maxPrice) {
            await updateSellOrderMargin(binance, openSellOrders[0], maxPrice);
          }
        }

      } else {
        if (openBuyOrders.length == 0) {
          placeCrossMarginSell(binance, 12, maxPrice)
        }
      }
    }
    resolve();
  })
}

export {
  checkForSell,
  checkForSellMargin
}
