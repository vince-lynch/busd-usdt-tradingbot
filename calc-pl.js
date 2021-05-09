import fs from 'fs'
const TRADES_LOG = `./src/trades/trades.json`;

const trades = JSON.parse(fs.readFileSync(TRADES_LOG, 'utf8')).reverse();
const twentyFourHoursAgoUnix = Date.now() - (86400 * 1000); // * days, if you want to calculate more.

const buyTrades = trades.filter((trade) => trade.isBuyer && trade.time > twentyFourHoursAgoUnix);
const sellTrades = trades.filter((trade) => !trade.isBuyer && trade.time > twentyFourHoursAgoUnix);

var totalBuySum = buyTrades.reduce((total, trade) => {
  return parseFloat(total) + (parseFloat(trade.price) * parseFloat(trade.qty));
}, 0)

var totalSellSum = sellTrades.reduce((total, trade) => {
  return parseFloat(total) + (parseFloat(trade.price) * parseFloat(trade.qty));
}, 0)

const profitLoss = totalBuySum - totalSellSum;

console.log('profit-loss for last 24hr period is', profitLoss);

const getHourAgoUnix = (numHrs) => Date.now() - ((3600 * 1000) * numHrs);

for (let hrsAgo = 1; hrsAgo < 25; hrsAgo++) {
  // Runs 25 times, with values of step 1 through 24.
  var buys = trades.filter((trade) => trade.isBuyer && trade.time > getHourAgoUnix(hrsAgo));
  var sells = trades.filter((trade) => !trade.isBuyer && trade.time > getHourAgoUnix(hrsAgo));
  var buySum = buys.reduce((total, trade) => {
    return parseFloat(total) + (parseFloat(trade.price) * parseFloat(trade.qty));
  }, 0)
  var sellSum = sells.reduce((total, trade) => {
    return parseFloat(total) + (parseFloat(trade.price) * parseFloat(trade.qty));
  }, 0)
  console.log(` ${hrsAgo} hour ago `, buySum - sellSum);
}