import { crossAccountDetails } from '../margin/account.js';

const getBalance = (binance) => {
  return new Promise(async (resolve) => {
      binance.balance((error, balances) => {
          if (error) 
              return console.error(error);
          

          resolve({BUSD: parseFloat(balances.BUSD.available), USDT: parseFloat(balances.USDT.available)})
      })
  });
}

const getMarginBalances = (binance) => {
  return new Promise((resolve) => {
    crossAccountDetails(binance).then((data) => {
      console.log('crossAccountDetails - data', data);
      const usdtBalance = data.userAssets.find((a) => a.asset == 'USDT');
      const busdBalance = data.userAssets.find((a) => a.asset == 'BUSD');
      resolve({ BUSD: parseFloat(busdBalance.free), USDT: parseFloat(usdtBalance.free) })
    })
  })
}


export {
  getBalance,
  getMarginBalances
}
