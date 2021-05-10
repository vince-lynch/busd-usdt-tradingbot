import fs from 'fs'
import { startPricesFeed } from './price/feed.js'
import { startListeningBook } from './depth/book.js'
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
  eventEmitter.on('newPrice', (priceRange) => {
    console.log('newPrice', priceRange);
  })
  startPricesFeed(binance, eventEmitter);
  //
  //startListeningBook(binance, eventEmitter)

  eventEmitter.on('start', number => {
    console.log(`started ${number}`)
  })
  //await loadAccountDetails(binance);
}

setTimeout(()=> {
  eventEmitter.emit('start', 23);
}, 8000)

export {
  crossNoLeverage
}