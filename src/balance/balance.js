const getBalance = (binance) => {
  return new Promise(async (resolve) => {
      binance.balance((error, balances) => {
          if (error) 
              return console.error(error);
          

          resolve({BUSD: parseFloat(balances.BUSD.available), USDT: parseFloat(balances.USDT.available)})
      })
  });
}

export {
  getBalance
}
