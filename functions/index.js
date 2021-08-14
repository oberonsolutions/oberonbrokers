const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
const cfgTicker = require('./ticker-config.json');

admin.initializeApp();


/*  updateRates()
 *  This function periodically updates the global fiat exchange rates
 */
exports.updateRates = functions.pubsub.schedule('every 6 hours')
  .onRun((context) => {

    // Connect to Database
    const db = admin.database();
    var ref = db.ref('ticker/global/rates');

    // Fetch Rates from Coincap
    axios.get(encodeURI('https://api.coincap.io/v2/rates'))
      .then(res => {
        // Parse Response
        res.data.data.forEach(fiat => {
          // Update Database
          ref.child(fiat.id).update(fiat);
        });
      })
      .catch(error => {
        // Log Error
        console.error(error.message);
      });

    return null;
  });

/*  updateAssets()
*  This function periodically updates the global crypto asset prices
*/
exports.updateAssets = functions.pubsub.schedule('every 1 minutes')
  .onRun((context) => {

    // Connect to Database
    const db = admin.database();
    var ref = db.ref('ticker/global/assets');

    // Pull the complete ticker data
    axios.get(encodeURI('https://api.coincap.io/v2/assets'))
      .then(res => {
        // Parse response
        res.data.data.forEach(asset => {
          // Update Database
          ref.child(asset.id).update(asset);
        });
      })
      .catch(error => {
        console.error(error.message);
      });

    return null;
  });

/*  updateMarkets()
 *  This function updates market data whenever a global asset or rate
 *  changes.
 */
exports.updateMarkets = functions.database.ref('ticker/global')
  .onUpdate((change, context) => {

    const data = change.after.val();
    let markets = {};

    // Connect to Database
    const db = admin.database();
    var ref = db.ref('ticker/markets');

    // Loop through defined markets
    for (const market in cfgTicker.markets) {
      console.info(market);
      console.info(JSON.stringify(cfgTicker.markets[market]));

      // Init market object
      markets[market] = {};

      // Loop through defined assets
      for (const asset of cfgTicker.markets[market].assets) {
        const assetSymbol = data.assets[asset].symbol;

        // Init asset object
        markets[market][assetSymbol] = {
          id: data.assets[asset].id,
          name: data.assets[asset].name,
          symbol: data.assets[asset].symbol,
          rank: data.assets[asset].rank,
          icon: "https://oberonbrokers.web.app/img/" + data.assets[asset].id + ".png",
          prices: {}
        };

        // Loop through defined rates
        for (const rate of cfgTicker.markets[market].rates) {

          // Calculate Bid and Ask Prices
          const rateUsd = parseFloat(data.rates[rate].rateUsd);
          const priceUsd = parseFloat(data.assets[asset].priceUsd);
          const priceLocal = priceUsd / rateUsd;
          const rateSymbol = data.rates[rate].symbol;
          const currencySymbol = data.rates[rate].currencySymbol;
          const bid = (1 + cfgTicker.markets[market].markup.bid) * priceLocal;
          const ask = (1 + cfgTicker.markets[market].markup.ask) * priceLocal;

          // Do we want more or fewer decimals in our displayed price?
          var digits = 2;
          if (typeof cfgTicker.display !== 'undefined') {
            if (typeof cfgTicker.display[rate] !== 'undefined') {
              if (typeof cfgTicker.display[rate].decimals !== 'undefined') {
                digits = cfgTicker.display[rate].decimals;
              }
            }
          }

          // Update the prices object
          markets[market][assetSymbol].prices[rateSymbol] = {
            bid: currencySymbol + ' ' + Intl.NumberFormat('en-EN', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(bid),
            ask: currencySymbol + ' ' + Intl.NumberFormat('en-EN', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(ask)
          };
        };
      };
    };

    // Update Database
    ref.update(markets);

    return null;
  });