import { priceRange, startPricesFeed } from './price/feed.js'
import { crossMarginOrderListener } from './order/listener.js';
import { cancelAllOrdersMargin } from './order/cancel.js';
import { getPositionMargin } from './position/index.js';
import { makeActionCrossMargin } from './action/index.js';
import EventEmitter from 'events';
//const FS_CROSS_ACCOUNT = `./src/margin/cross-account.json`;

const eventEmitter = new EventEmitter();

/**
 * Price has moved, make action or adjustment
 */
const adjustPosition = async(binance) => {
  const { maxPrice, minPrice } = priceRange();
  console.log('currentPosition:', await getPositionMargin(binance));
  await makeActionCrossMargin(binance, { maxPrice, minPrice })
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
    //adjustPosition(binance); -- off until I understand why events aren't been picked up.
  });

  eventEmitter.on('orderEvent', (assetChanges) => {
    console.log('orderEvent', assetChanges);
    /**
     * Price has moved, make action or adjustment
     */
     //adjustPosition(binance); -- off until I understand why events aren't been picked up.
  })
  // Listens for when orders change. i.e. trade is filled.
  crossMarginOrderListener(binance, eventEmitter);
  // Listens for when the price changes, i.e. new low/high for the past 120 trades.
  startPricesFeed(binance, eventEmitter);


  //cancelAllOrdersMargin(binance)
  // Had to add interval back
  // For some reason the listeners above are faulty, not sure if sockets connection breaks maybe?
  setInterval(()=>{
    adjustPosition(binance);
  }, 30 * 1000)
}


export {
  crossNoLeverage
}