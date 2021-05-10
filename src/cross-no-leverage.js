import fs from 'fs'
const FS_CROSS_ACCOUNT = `./src/margin/cross-account.json`;

const loadAccountDetails = (binance) => {
  return new Promise((resolve) => {
    /**
     * Hi, please fix line 4686 at node-binance-api.js:
     * const endpoint = 'v1/margin' + (isIsolated)?'/isolated':'' + '/account'
     * to
     * const endpoint = 'v1/margin' + (isIsolated?'/isolated':'') + '/account'
     */
    binance.mgAccount((error, crossAccountDetails) => {
      if (error) {
        return console.warn(error);
        resolve();
      } else {
        console.info("crossAccountDetails response:", crossAccountDetails);
        fs.writeFileSync(FS_CROSS_ACCOUNT, JSON.stringify(crossAccountDetails));
        resolve();
      }
    }, false)
  })
}

const crossNoLeverage = async(binance) => {
  await loadAccountDetails(binance);
}

export {
  crossNoLeverage
}