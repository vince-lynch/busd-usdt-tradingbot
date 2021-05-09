// const realLength = (arr) => arr.reduce((price) => price);
const average = arr => arr.reduce((p, c) => parseFloat(p) + parseFloat(c), 0) / arr.length;
const max = arr => Math.max(...arr);
const min = arr => Math.min(...arr);


const getBalance = (binance) => {
    return new Promise(async (resolve) => {
        binance.balance((error, balances) => {
            if (error) 
                return console.error(error);
            
            resolve({BUSD: balances.BUSD.available, USDT: balances.USDT.available})
        })
    });
}


const getLastTrade = (binance) => {
    return new Promise(async (resolve) => {
        binance.trades("BUSDUSDT", (error, trades, symbol) => {
            console.info(symbol + " trade history", trades[0]);
            resolve(trades[trades.length - 1])
        });
    })
}

const getOpenOrders = (binance) => {
    return new Promise(async (resolve) => {
        binance.openOrders("BUSDUSDT", (error, orders, symbol) => {
            const openSellOrders = orders.filter((order) => order.side == 'SELL');
            const openBuyOrders = orders.filter((order) => order.side == 'BUY');
            resolve({openBuyOrders, openSellOrders})
        });
    })
}

const position = {
    priceBelow: null,
    currentPosition: null,
    priceAbove: null
}

const logPosition = (priceBought) => {
    position.currentPosition = parseFloat(priceBought);
    position.priceBelow = parseFloat(priceBought) - 0.0001;
    position.priceAbove = parseFloat(priceBought) + 0.0001;
    console.log('updated position, buy complete: ', position);
}


let currentPrice = 0.9989;
let dataLimit = 120;
let dataSoFar = new Array(dataLimit)

const priceRange = () => {
    return {
        maxPrice: max(dataSoFar),
        minPrice: min(dataSoFar),
        averagePrice: average(dataSoFar),
        lastPrice: parseFloat(dataSoFar[dataSoFar.length - 1])
    };
}

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

/**
 * Sets the sell price to be the break even price i.e. price bought in at.
 */
const setSellAtBreakEven = (binance, boughtInPrice) => {
    return new Promise(async (resolve) => {
        binance.sell("BUSDUSDT", 12, boughtInPrice, {
            type: 'LIMIT'
        }, (error, response) => {
            console.log('limit sell error', error)
            console.info("Limit sell response", response);
            console.info("order id: " + response.orderId);
            resolve()
        });
    })
}

const setBuyAtNewLowest = (binance, minPrice) => {
    return new Promise(async (resolve) => {
        binance.buy("BUSDUSDT", 12, minPrice, {
            type: 'LIMIT'
        }, (error, response) => {
            console.log('limit sell error', error)
            console.info("Limit sell response", response);
            console.info("order id: " + response.orderId);
            resolve()
        });
    })
}

/**
 * UpdateSellToBreakEven
 * 
 * if price moves whilst trying to sell, update sell price to break even price
 * if its bought in at 0.9988, and it sees 0.9987, it should cancel pending sell order at 0.9989, and make new sell order at 0.9988
 */
const updateSellToBreakEven = async (binance, openSellOrder) => {
    await cancelOrder(binance, openSellOrder.orderId);
    await setSellAtBreakEven(binance, position.currentPosition);
}

const updateBuyPriceToNewLowest = async (binance, orderId, minPrice) => {
    await cancelOrder(binance, orderId);
    await setBuyAtNewLowest(binance, minPrice);
}

const doStuff = async (binance, {maxPrice, minPrice, averagePrice, lastPrice}) => {
    getBalance(binance).then(async ({BUSD, USDT}) => {
        console.info("BUSD balance: ", BUSD);
        console.info("USDT balance: ", USDT);

        const {openBuyOrders, openSellOrders} = await getOpenOrders(binance);
        // const { price, qty } = await getLastTrade(binance);
        console.log('openOrders:', openBuyOrders, openSellOrders);

        /**
   * If we have no BUSD
   * AND no sell orders are pending
   * The look to buy, our update our buy order
   */
        if (BUSD < 3 && openSellOrders.length == 0) {
            // We are not in the asset, so we want to buy.
            // and we don't have an open buy order open
            if (currentPrice < 0.9996 // no buy liquidity at more than 0.9995
            && openBuyOrders.length == 0
            // only buy if no buy orders open
            // no min buy price
            ) {
                // never buy at 0.9996 //  must be lower.
                // const buyPrice = currentPrice - 0.0001;
                binance.buy("BUSDUSDT", 12, minPrice, {type: 'LIMIT'});
                logPosition(minPrice);
            }

            if (currentPrice < 0.9996 // no buy liquidity at more than 0.9995
            && openBuyOrders.length > 0
            // no min buy price
            ) {
                /**
           * if price moves whilst trying to buy, update buy price to new lowest price
           * if max price, is two ticks higher than where we want to buy in.. then adjust to 1 below.
           * if min price is anywhere beneath where we are trying to buy in, then adjust to min price.
           */
                if (maxPrice > parseFloat(openBuyOrders[0].price) + 0.0001 || minPrice < parseFloat(openBuyOrders[0].price)) {
                    await updateBuyPriceToNewLowest(binance, openBuyOrders[0].orderId, minPrice);
                }
            }
        }

        /**
     * In an order
     */
        if (BUSD > 2 || openSellOrders.length) {
            // my last buy in (trade), must be relevant because I am in the asset.
            // and i've either already placed the sell limit order
            if (openSellOrders.length) {
                // Usually just wait for the sell order to go through.
                // In some cases we might want to sell for what the current price is,
                // i.e. incase it drops to the price beneath,
                if (openBuyOrders.length == 0) {
                    /**
           * if price moves whilst trying to sell, update sell price to break even price
           * if its bought in at 0.9988, and it sees 0.9987, it should cancel pending sell order at 0.9989, and make new sell order at 0.9988
           */
                    if (maxPrice <= position.currentPosition) {
                        // if there is no opportunity to sell at the price above our buy-in price anymore, then
                        if (parseFloat(openSellOrders[0].price) < position.currentPosition) {
                            /**
               * we are only adjusting our sell position - to break even - if we haven't already got
               * a sell order placed at our break even price
               */
                            await updateSellToBreakEven(binance, openSellOrders[0]);
                        }
                    }
                }

            } else {
                // or I need to place the sell limit order
                // Sell at 1 above where you bought.
                // const priceToSell = parseFloat(price) + 0.0001;
                if (openBuyOrders.length == 0) {
                    binance.sell("BUSDUSDT", 12, maxPrice, {
                        type: 'LIMIT'
                    }, (error, response) => {
                        console.log('limit sell error', error)
                        console.info("Limit sell response", response);
                        console.info("order id: " + response.orderId);
                        // position isn't cleared until sell order limit has been filled
                        // clearPosition();
                    });
                }
            }
        }

    });
}

const startTradesListener = (binance) => {
    binance.websockets.trades(['BUSDUSDT'], (trades) => {
        let {
            e: eventType,
            E: eventTime,
            s: symbol,
            p: price,
            q: quantity,
            m: maker,
            a: tradeId
        } = trades;

        // console.log('price', price, 'quantity', quantity);
        dataSoFar.shift() // remove first price
        dataSoFar.push(price) // add a price
        currentPrice = price;
    });
}

const getPositionOnInit = async (binance) => {
    return new Promise(async (resolve) => {
        const lastTrade = await getLastTrade(binance);
        if (lastTrade.isBuyer) {
            logPosition(lastTrade.price)
            resolve(position);
        }
        resolve(position);
    })
}

const cancelAllOpenOrders = (binance) => {
    return new Promise(async (resolve) => {
        const {openBuyOrders, openSellOrders} = await getOpenOrders(binance);
        // needs rethinking as not syncronous
        openBuyOrders.forEach((order) => {
            cancelOrder(binance, order.orderId);
        })
        openSellOrders.forEach((order) => {
            // needs rethinking as not syncronous
            cancelOrder(binance, order.orderId);
        })
        resolve()
    })
}


const startTerminalChart = async (binance) => {
    startTradesListener(binance);
    //
    // Cancel open orders on load -- price has probably changed.
    // await cancelAllOpenOrders(binance);
    // Need to write logic to determine position if already in asset when
    // when the software loads..
    const positionNow = await getPositionOnInit(binance)
    console.log('currentPosition: ', positionNow);
    //
    setInterval(async () => {
        // get prices so we can decide on how to trade
        const {maxPrice, minPrice, averagePrice, lastPrice} = priceRange();
        console.log('currentPosition:', position);

        doStuff(binance, {maxPrice, minPrice, averagePrice, lastPrice})
    }, 30 * 1000);
}


export {
    startTerminalChart
}
