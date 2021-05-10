import {average, max, min} from '../utils/math.js';

let currentPrice = 0.9989;
let dataSoFar = []

const priceRange = () => {
    return {
        maxPrice: max(dataSoFar),
        minPrice: min(dataSoFar),
        //averagePrice: average(dataSoFar),
        lastPrice: parseFloat(currentPrice)
    };
}

const updatePriceStore = (priceFloat) => {
  if(dataSoFar.length > 119){ // cap on memory to store
    dataSoFar.shift() // remove first price
  }
  dataSoFar.push(priceFloat) // add a price
  currentPrice = priceFloat;
}


const startPricesFeed = (binance, eventEmitter) => {
  binance.websockets.trades(['BUSDUSDT'], (trades) => {
      let {
          e: eventType,
          E: eventTime,
          s: symbol,
          p: price,
          q: quantity,
          m: maker,
          a: tradeId
      } = trades;

      const priceFloat = parseFloat(price);
      // Do this before we update the array.
      if(dataSoFar.includes(priceFloat) == false){
        updatePriceStore(priceFloat)
        // Emit a new price if there is one, so we can act on it.
        eventEmitter.emit('priceEvent', priceRange());
      } else {
        updatePriceStore(priceFloat)
      }
      // console.log('price', price, 'quantity', quantity);
  });
}

export {
  currentPrice,
  priceRange,
  startPricesFeed
}