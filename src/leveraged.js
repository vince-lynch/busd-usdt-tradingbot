import fs from 'fs'
const FS_MARGIN_DETAILS = `./data/marginAccountDetails.json`;

// Globals
const symbol = 'BUSDUSDT';
const isIsolated = 'TRUE';


const limitOpen10xLong = (binance, usdtAmount = 12, limitPrice = 0.9981) => {
    const leveragedAmount = usdtAmount * 10;

    // Start placing the BUY order with the borrowed base asset plus your primary.
    binance.mgOrder('BUY', symbol, leveragedAmount, limitPrice, {
        isIsolated: true,
        sideEffectType: 'MARGIN_BUY',
        timeInForce: 'GTC'
    }, ((error, response) => {
        if (error) 
            return console.warn(error);

        console.info("marginOrder response:", response);
    }), isIsolated)
}

const limitClose10xLong = (binance, fullAmount = 120, limitPrice = 0.9995) => { // beware, fullAmount I think might have gone up, you need to get this from somewhere.
  // Start placing the BUY order with the borrowed base asset plus your primary.
  binance.mgOrder('SELL', symbol, fullAmount, limitPrice, {
      isIsolated: true,
      sideEffectType: 'AUTO_REPAY', // for close long, you need to 'AUTO_REPAY'
      timeInForce: 'GTC'
  }, ((error, response) => {
      if (error) 
          return console.warn(error);

      console.info("marginOrder response:", response);
  }), isIsolated)
} 


const getOpenOrders = (binance) => { /**
   * Gets open orders
   * @param {string} symbol - the symbol to get
   * @param {function} callback - the callback function
   * @return {undefined}
   */
    binance.mgOpenOrders('BUSDUSDT', (error, resOpenOrders) => {
        if (error) {
            return console.warn(error);
        } else { // Success! Transaction ID: response.tranId
            console.info("getOpenOrders response:", resOpenOrders);
        }
    });
}

const busdUsdtWithLeverage = (binance) => {
    console.log('Starting...');
    const isIsolated = true;

    binance.mgAccount((error, marginAccountDetails) => {
        if (error) 
            return console.warn(error);
        

        /**
         * Hi, please fix line 4686 at node-binance-api.js:
         * const endpoint = 'v1/margin' + (isIsolated)?'/isolated':'' + '/account'
         * to
         * const endpoint = 'v1/margin' + (isIsolated?'/isolated':'') + '/account'
         */
        console.info("marginAccountDetails response:", marginAccountDetails);
        fs.writeFileSync(FS_MARGIN_DETAILS, JSON.stringify(marginAccountDetails));

        // make a test margin order
        //limitOpen10xLong(binance);
    }, isIsolated)
}

export {
    busdUsdtWithLeverage
}
