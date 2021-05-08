import fs from 'fs'
const FS_MARGIN_DETAILS = `./data/marginAccountDetails.json`;

// Globals
const symbol = 'BUSDUSDT';



/**
 * Borrows to open a limit long
 * @param {} binance 
 * @param {number} amount USD amount, will be leveraged 10x
 */
const marginOrderLong = (binance, usdtAmount = 12, limitPrice = 0.0984) => {
	const leveragedAmount = usdtAmount * 10;
	const isIsolated = 'TRUE';
	
	// Need to error handle, it might be that you already have borrowed the money before transaction?? unsure
	binance.mgBorrow('USDT', leveragedAmount, (error, borrowRes) => {
    if ( error ) {
			return console.warn(error);
		} else {
    	// Success! Transaction ID: response.tranId
			console.info("marginOrder response:", borrowRes);
		}
		// Start placing the BUY order with the borrowed base asset plus your primary.
		binance.mgOrder('BUY', symbol, leveragedAmount, limitPrice, { isIsolated: true }, (( error, response ) => {
			if (error) 
				return console.warn(error);

			console.info("marginOrder response:", response);
		}), isIsolated) 

	}, isIsolated, symbol);
		
		// {
    //     marginOrder(side, symbol, quantity, price, {
    //         ...flags,
    //         isIsolated
    //     }, callback);
    // }
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
				marginOrderLong(binance);
    }, isIsolated)
}

export {
    busdUsdtWithLeverage
}
