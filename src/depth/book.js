let book = {
  asks: null,
  bids: null
}

const startListeningBook = (binance, eventEmitter) => {
  binance.websockets.depth(['BUSDUSDT'], (depth) => {
    let {e:eventType, E:eventTime, s:symbol, u:updateId, b:bidDepth, a:askDepth} = depth;
    console.info(symbol+" market depth update");
    console.info(bidDepth, askDepth);

    book.asks = askDepth;
    book.bids = bidDepth;
  });
}

export {
  startListeningBook
}