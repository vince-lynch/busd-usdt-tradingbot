import fs from 'fs';
const TRADES_LOG = `./src/trades/trades.json`;

const getLastTrade = (binance) => {
  return new Promise(async (resolve) => {
      binance.trades("BUSDUSDT", (error, trades, symbol) => {
        // Write to Trade file, so we can see whats going on
        fs.writeFileSync(TRADES_LOG, JSON.stringify(trades));

        console.info(symbol + " trade history", trades[0]);
        resolve(trades[trades.length - 1])
      });
  })
}

export {
  getLastTrade
}