const listOrders = (binance) => {
  return new Promise(async (resolve) => {
      binance.openOrders("BUSDUSDT", (error, orders, symbol) => {
        if(error == null){
          const openSellOrders = orders.filter((order) => order.side == 'SELL');
          const openBuyOrders = orders.filter((order) => order.side == 'BUY');
          resolve({openBuyOrders, openSellOrders})
        } else {
          reject(error);
        }
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
        const sortedOrders = orders.sort((a, b) => b.time - a.time)
        const openSellOrders = sortedOrders.filter((order) => order.side == 'SELL' && order.status == 'NEW');
        const openBuyOrders = sortedOrders.filter((order) => order.side == 'BUY' && order.status == 'NEW');
        resolve({ openBuyOrders, openSellOrders, allOpenOrders: sortedOrders });
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
