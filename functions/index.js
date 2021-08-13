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
    cfgTicker.global.rates.forEach(fiat => {
      // Fetch Rate
      axios.get(encodeURI('https://api.coincap.io/v2/rates/' + fiat))
        .then(res => {
          // Parse Response
          const rate = {
            id: res.data.data.id,
            symbol: res.data.data.symbol,
            currencySymbol: res.data.data.currencySymbol,
            rateUsd: res.data.data.rateUsd
          };
          // Update Database
          ref.child(fiat).update(rate);
        })
        .catch(error => {
          // Log Error
          console.error(error.message);
        });
    })

    return null;
  });

/*  updateAssets()
*  This function periodically updates the global crypto asset prices
*/
exports.updateAssets = functions.pubsub.schedule('every minute')
  .onRun((context) => {

    // Connect to Database
    const db = admin.database();
    var ref = db.ref('ticker/global/assets');

    // Join the assets to search
    const ids = cfgTicker.global.assets.join(',');
    axios.get(encodeURI('https://api.coincap.io/v2/assets?ids=' + ids))
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
