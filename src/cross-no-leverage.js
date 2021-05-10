import fs from 'fs'
import { startPricesFeed } from './price/feed.js'
import { crossMarginOrderListener } from './order/listener.js'
import EventEmitter from 'events';
const FS_CROSS_ACCOUNT = `./src/margin/cross-account.json`;

const eventEmitter = new EventEmitter();

const loadAccountDetails = (binance) => {
  return new Promise((resolve) => {
    /**
     * Hi, please fix line 4686 at node-binance-api.js:
     * const endpoint = 'v1/margin' + (isIsolated)?'/isolated':'' + '/account'
     * to
     * const endpoint = 'v1/margin' + (isIsolated?'/isolated':'') + '/account'
     */
    binance.mgAccount((error, crossAccountDetails) => {
      if (error) {
        return console.warn(error);
        resolve();
      } else {
        console.info("crossAccountDetails response:", crossAccountDetails);
        fs.writeFileSync(FS_CROSS_ACCOUNT, JSON.stringify(crossAccountDetails));
        resolve();
      }
    }, false)
  })
}

const crossNoLeverage = async(binance) => {
  /**
   * Using events, rather than intervals
   * means quicker placing of trades based on events.
   */
  eventEmitter.on('priceEvent', (priceRange) => {
    console.log('priceEvent', priceRange);
  });

  eventEmitter.on('orderEvent', (assetChanges) => {
    console.log('orderEvent', assetChanges);
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