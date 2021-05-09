const listOrders = (binance) => {
  return new Promise(async (resolve) => {
      binance.openOrders("BUSDUSDT", (error, orders, symbol) => {
          const openSellOrders = orders.filter((order) => order.side == 'SELL');
          const openBuyOrders = orders.filter((order) => order.side == 'BUY');
          resolve({openBuyOrders, openSellOrders})
      });
  })
}

export {
  listOrders
}
