const listOrders = (binance) => {
  return new Promise(async (resolve) => {
      binance.openOrders("BUSDUSDT", (error, orders, symbol) => {
          const openSellOrders = orders.filter((order) => order.side == 'SELL');
          const openBuyOrders = orders.filter((order) => order.side == 'BUY');
          resolve({openBuyOrders, openSellOrders})
      });
  })
}

const listOrdersMargin = (binance) => {
  return new Promise(async (resolve, reject) => {
    binance.mgAllOrders("BUSDUSDT", (error, orders, symbol) => {
      if(error == null) {
      /**
       * Order status == 'new' means unfilled
       */
       const openSellOrders = orders.filter((order) => order.side == 'SELL' && order.status == 'NEW');
       const openBuyOrders = orders.filter((order) => order.side == 'BUY' && order.status == 'NEW');
       resolve({openBuyOrders, openSellOrders});
      } else {
        reject(error);
      }
    })
  })
}

export {
  listOrders,
  listOrdersMargin
}
