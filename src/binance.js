import { getBalance } from './balance/balance.js';
import { listOrders } from './order/list.js';
import { getPosition } from './position/index.js';
import { checkForSell } from './order/sell.js';
import { checkForBuy } from './order/buy.js';
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


const makeActionOrAdjustment = async (binance, { maxPrice, minPrice }) => {
    getBalance(binance).then(async ({BUSD, USDT}) => {
        console.info("BUSD balance: ", BUSD);
        console.info("USDT balance: ", USDT);

        const {openBuyOrders, openSellOrders} = await listOrders(binance);
        // const { price, qty } = await getLastTrade(binance);
        console.log('openOrders:', openBuyOrders, openSellOrders);

        /**
       * checking for buy and sell
       */
        await checkForBuy(binance, openSellOrders, openBuyOrders, {
            BUSD,
            USDT
        }, { maxPrice, minPrice });
        await checkForSell(binance, openSellOrders, openBuyOrders, {
            BUSD,
            USDT
        }, { maxPrice, minPrice });
    });
}


export {
  startBusdUsdtBot
}
