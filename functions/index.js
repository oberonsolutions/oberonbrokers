const functions = require("firebase-functions");
const cfgTicker = require('./ticker-config.json');

exports.updateRates = functions.pubsub.schedule('0 0 * * *')
  .timeZone('America/New_York')
  .onRun((context) => {
    console.log('This will be run every 5 minutes!');
    return null;
  });
