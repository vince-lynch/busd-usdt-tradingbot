import { getBalance, getMarginBalances } from '../balance/balance.js';
import { listOrders, listOrdersMargin } from '../order/list.js';
import { checkForSell, checkForSellMargin } from '../order/sell.js';
import { checkForBuy, checkForBuyMargin } from '../order/buy.js';

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



const makeActionCrossMargin = async(binance, { maxPrice, minPrice }) => {
  try {
    getMarginBalances(binance).then(async ({BUSD, USDT}) => {
      const { openBuyOrders, openSellOrders } = await listOrdersMargin(binance);
      console.log(openBuyOrders, openSellOrders);
  
       /**
       * checking for buy and sell
       */
        await checkForBuyMargin(binance, openSellOrders, openBuyOrders, {
            BUSD,
            USDT
        }, { maxPrice, minPrice });
        await checkForSellMargin(binance, openSellOrders, openBuyOrders, {
            BUSD,
            USDT
        }, { maxPrice, minPrice });
    });
  } catch (err) {
    console.log('catch error', err);
  }
} 

export {
  makeActionOrAdjustment,
  makeActionCrossMargin
}
