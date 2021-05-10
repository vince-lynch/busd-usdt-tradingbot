import { priceRange, startPricesFeed } from './price/feed.js'
import { crossMarginOrderListener } from './order/listener.js';
import { getPosition } from './position/index.js';
import { makeActionCrossMargin } from './action/index.js';
import EventEmitter from 'events';
//const FS_CROSS_ACCOUNT = `./src/margin/cross-account.json`;

const eventEmitter = new EventEmitter();

/**
 * Price has moved, make action or adjustment
 */
const adjustPosition = async(binance) => {
  const { maxPrice, minPrice } = priceRange();
  console.log('currentPosition:', await getPosition(binance));
  makeActionCrossMargin(binance, { maxPrice, minPrice })
}

const crossNoLeverage = async(binance) => {
  /**
   * Using events, rather than intervals
   * means quicker placing of trades based on events.
   */
  eventEmitter.on('priceEvent', (priceRange) => {
    console.log('priceEvent', priceRange);
    /**
     * Price has moved, make action or adjustment
     */
     adjustPosition(binance);
  });

  eventEmitter.on('orderEvent', (assetChanges) => {
    console.log('orderEvent', assetChanges);
    /**
     * Price has moved, make action or adjustment
     */
     adjustPosition(binance);
  })
  // Listens for when orders change. i.e. trade is filled.
  crossMarginOrderListener(binance, eventEmitter);
  // Listens for when the price changes, i.e. new low/high for the past 120 trades.
  startPricesFeed(binance, eventEmitter);

  // Not needed for now, just implementing functionality we had but on cross margin account
  // But with no 30 second setInterval
  //await loadAccountDetails(binance);
}


export {
  crossNoLeverage
}