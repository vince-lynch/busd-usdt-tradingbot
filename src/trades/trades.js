import fs from 'fs';
const TRADES_LOG = `./src/trades/trades.json`;
const CROSSTRADES_LOG = `./src/trades/cross_trades.json`;

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

const getLastTradeMargin = (binance) => {
  //
  return new Promise(async (resolve, reject) => {
    binance.mgAllOrders("BUSDUSDT", (error, orders, symbol) => {
      if(error == null) {
        const sortedOrders = orders.sort((a, b) => b.updateTime - a.updateTime)
        const trades = sortedOrders.filter((order) => order.status == 'FILLED')
        // Write to Trade file, so we can see whats going on
        fs.writeFileSync(CROSSTRADES_LOG, JSON.stringify(trades));
  
        console.info(symbol + " trade history", trades[0]);
        resolve(trades[0])
      } else {
        reject()
      }

    });
  })
}

export {
  getLastTrade,
  getLastTradeMargin
}