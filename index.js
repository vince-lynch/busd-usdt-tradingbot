import { startBusdUsdtBot } from './src/binance.js'
import { busdUsdtWithLeverage } from './src/leveraged.js'
import { crossNoLeverage } from './src/cross-no-leverage.js';
import Binance from 'node-binance-api'
import dotenv from 'dotenv'

const envVars = dotenv.config()
process.env = { ...process.env, ...envVars.parsed }
// Setup binance
console.log(process.env.BINANCE_APIKEY)
const binance = new Binance().options({
  APIKEY: process.env.BINANCE_APIKEY,
  APISECRET: process.env.BINANCE_SECRET,
});


startBusdUsdtBot(binance);

/**
 * So weird how the cross leverage has been playing up,.
 * Fairly sure the code is simple, .. 
 * orders endpoint just returns the wrong information
 * (maybe there is another way?!)
 */

//busdUsdtWithLeverage(binance);
//crossNoLeverage(binance);
