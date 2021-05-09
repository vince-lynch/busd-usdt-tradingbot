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

export {
  cancelOrder,
  cancelOrdersList
}
