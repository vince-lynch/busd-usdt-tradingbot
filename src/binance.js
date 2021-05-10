import { getPosition } from './position/index.js';
import { makeActionOrAdjustment } from './action/index.js';
import { priceRange, startPricesFeed } from './price/feed.js'


const startBusdUsdtBot = async (binance) => {
  startPricesFeed(binance);
  //
  const positionNow = await getPosition(binance);
  console.log('currentPosition: ', positionNow);
  //
  setInterval(async () => { // get prices so we can decide on how to trade
    const { maxPrice, minPrice } = priceRange();
    console.log('currentPosition:', await getPosition(binance));

    makeActionOrAdjustment(binance, { maxPrice, minPrice })
  }, 30 * 1000);
}

export {
  startBusdUsdtBot
}
