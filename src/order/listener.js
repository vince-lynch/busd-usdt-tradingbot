

const crossMarginOrderListener = (binance, eventEmitter) => {
  binance.websockets.userMarginData((assetChanges) => {
    assetChanges.B.forEach((asset) => {
      const { a: name, f: filled, l: long } = asset; 
      if(name == 'BUSD'){
        console.log('BUSD - order placed or trade filled', asset);
      }
      if(name == 'USDT'){
        console.log('USDT - order placed or trade filled', asset);
      }
    })
    eventEmitter.emit('orderEvent', assetChanges);
  });
}

export {
  crossMarginOrderListener
}