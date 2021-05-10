/**
 * Cancels any pending orders
 */
 const cancelOrder = (binance, orderId) => {
  return new Promise(async (resolve,) => {
      binance.cancel("BUSDUSDT", orderId, (error, response, symbol) => {
          if(error == null){
            console.info(symbol + " cancel response:", response);
            resolve();
          } else {
            reject(error)
          }
      });
  })
}

const cancelOrdersList = (binance, listOfOrders = []) => {
  return Promise.all(listOfOrders.forEach((order) => cancelOrder(binance, order.orderId)));
}

export {
  cancelOrder,
  cancelOrdersList
}
