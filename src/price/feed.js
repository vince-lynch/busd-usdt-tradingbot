import {average, max, min} from '../utils/math.js';

let currentPrice = 0.9989;
let dataLimit = 120;
let dataSoFar = new Array(dataLimit)

const priceRange = () => {
    return {
        maxPrice: max(dataSoFar),
        minPrice: min(dataSoFar),
        averagePrice: average(dataSoFar),
        lastPrice: parseFloat(dataSoFar[dataSoFar.length - 1])
    };
}


const startPricesFeed = (binance) => {
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

      // console.log('price', price, 'quantity', quantity);
      dataSoFar.shift() // remove first price
      dataSoFar.push(price) // add a price
      currentPrice = parseFloat(price);
  });
}

export {
  currentPrice,
  priceRange,
  startPricesFeed
}