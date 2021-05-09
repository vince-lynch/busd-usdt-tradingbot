import fs from 'fs';
import { getLastTrade } from '../trades/trades.js';
const POSITION_LOG = `./src/position/position.json`;

const position = {
  priceBelow: null,
  currentPosition: null,
  priceAbove: null
}

const logPosition = (trade) => {
  var positionHeld = trade;
  var price = parseFloat(positionHeld.price);
  position.currentPosition = price;
  position.priceBelow = parseFloat((price - 0.0001).toFixed(4));
  position.priceAbove = parseFloat((price + 0.0001).toFixed(4));

  fs.writeFileSync(POSITION_LOG, JSON.stringify({ ...position, ...trade }));
  console.log('updated position, buy complete: ', position);
}

const getPosition = async (binance) => {
  return new Promise(async (resolve) => {
      const lastTrade = await getLastTrade(binance);
      if (lastTrade.isBuyer) {
          logPosition(lastTrade);
          resolve(position);
      }
      resolve(position);
  })
}

export {
  position,
  logPosition,
  getPosition
}