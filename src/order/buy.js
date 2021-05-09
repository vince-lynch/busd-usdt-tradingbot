import { currentPrice } from '../price/feed.js'
import { cancelOrder } from './cancel.js';

const setBuyAtNewLowest = (binance, minPrice) => {
  return new Promise(async (resolve) => {
      binance.buy("BUSDUSDT", 12, minPrice, {
          type: 'LIMIT'
      }, (error, response) => {
          console.log('limit sell error', error)
          console.info("Limit sell response", response);
          console.info("order id: " + response.orderId);
          resolve()
      });
  })
}

const updateBuyPriceToNewLowest = async (binance, orderId, minPrice) => {
  await cancelOrder(binance, orderId);
  await setBuyAtNewLowest(binance, minPrice);
}


/**
 * If we have no BUSD
 * AND no sell orders are pending
 * The look to buy, our update our buy order
 */
 const checkForBuy = (binance, openSellOrders, openBuyOrders, { BUSD }, { maxPrice, minPrice }) => {
  return new Promise(async (resolve, reject) => {
      if (BUSD < 3 && openSellOrders.length == 0) {
          // We are not in the asset, so we want to buy.
          // and we don't have an open buy order open
          if (currentPrice < 1.0004 // no buy liquidity at more than 0.9995
          && openBuyOrders.length == 0
          // only buy if no buy orders open
          // no min buy price
          ) {
              // never buy at 0.9996 //  must be lower.
              // const buyPrice = currentPrice - 0.0001;
              binance.buy("BUSDUSDT", 12, minPrice, {type: 'LIMIT'});
              // logPosition(minPrice); -- no point logging this until it gets filled
          }

          /**
     * We dont want to hold above 0.9995, 
     * but we dont mind having a 0.9995 buy waiting to go,
     * for when it trends back down.
     */
          // if(minPrice > 0.9995 && openBuyOrders.length == 0){
          // binance.buy("BUSDUSDT", 12, 0.9995, {type: 'LIMIT'});
          // logPosition(0.9995);
          // }

          if (currentPrice < 1.0004 // no buy liquidity at more than 0.9995
          && openBuyOrders.length > 0
          // no min buy price
          ) { /**
        * if price moves whilst trying to buy, update buy price to new lowest price
        * if max price, is two ticks higher than where we want to buy in.. then adjust to 1 below.
        * if min price is anywhere beneath where we are trying to buy in, then adjust to min price.
        */
              if (maxPrice > parseFloat(openBuyOrders[0].price) + 0.0001 || minPrice < parseFloat(openBuyOrders[0].price)) {

                  if (parseFloat(openBuyOrders[0].price) != minPrice) { /**
             * Only update the buyOrder to new lowest,
             * if the minPrice is lower than the price on our currentBuyOrder
             */
                      await updateBuyPriceToNewLowest(binance, openBuyOrders[0].orderId, minPrice);
                  }
              }
          }
      }
      resolve();
  })
}


export {
  checkForBuy
}