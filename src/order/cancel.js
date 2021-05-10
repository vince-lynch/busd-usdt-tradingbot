import { listOrdersMargin } from './list.js';

/**
 * Cancels any pending orders
 */
 const cancelOrder = (binance, orderId) => {
  return new Promise(async (resolve) => {
      binance.cancel("BUSDUSDT", orderId, (error, response, symbol) => {
          console.info(symbol + " cancel response:", response);
          resolve();
      });
  })
}

const cancelOrdersList = (binance, listOfOrders = []) => {
  return Promise.all(listOfOrders.forEach((order) => cancelOrder(binance, order.orderId)));
}

const cancelOrderMargin = (binance, orderId) => {
  return new Promise(async (resolve) => {
    binance.mgCancel("BUSDUSDT", orderId, (error, response, symbol) => {
      if(error){
        console.log('cancel error:', orderId, error);
      }
      console.info(symbol + " cancel response:", response);
      resolve();
    })
  });
}

const cancelAllOrdersMargin = (binance) => {
  console.log('Will attempt to cancell all orders for margin...')
  return new Promise(async (resolve) => {
    binance.mgCancelOrders("BUSDUSDT", (error, response, symbol) => {
      if(error){
        console.warn('Error cancelling margin orders', error);
      }
      console.info(symbol + " cancel response:", response);
      resolve();
    })
    // listOrdersMargin(binance).then(({ allOpenOrders }) => {
    //   allOpenOrders.forEach((order) => {
    //     cancelOrderMargin(binance, order.orderId)
    //   })
    //   resolve();
    // })
  })
}

export {
  cancelOrder,
  cancelOrdersList,
  cancelOrderMargin,
  cancelAllOrdersMargin
}
