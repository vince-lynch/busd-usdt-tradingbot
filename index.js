import { startTerminalChart } from './src/binance.js'
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


startTerminalChart(binance);

// binance.websockets.depthCache(['BUSDUSDT'], (symbol, depth) => {
//   console.info(symbol+" market depth update");
//   console.info(bidDepth, askDepth);
// });