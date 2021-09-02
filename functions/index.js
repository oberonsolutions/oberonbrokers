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
