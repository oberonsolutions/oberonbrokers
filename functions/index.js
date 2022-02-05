const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const cfgTicker = require("./ticker-config.json");

admin.initializeApp();

/*  tickerUpdate()
 *  This function periodically updates the ticker
 */
exports.tickerUpdate = functions.pubsub.schedule("every 1 minutes").onRun((context) => {
  // Fetch Coincap Data
  const axiosConfig = { headers: { Authorization: "Bearer 8d68f651-3829-40f8-a3e9-e6c462c14e39" } };
  const ratesPromise = axios.get("https://api.coincap.io/v2/rates", axiosConfig);
  const assetsPromise = axios.get("https://api.coincap.io/v2/assets?limit=1000", axiosConfig);
  Promise.all([ratesPromise, assetsPromise])
    .then((response) => {
      // Map Data
      const map = {
        rates: response[0].data.data,
        assets: response[1].data.data,
      };

      // Create Data Object
      let data = {
        rates: {},
        assets: {},
      };
      for (const rate of map.rates) {
        data.rates[rate.id] = rate;
      }
      for (const asset of map.assets) {
        data.assets[asset.id] = asset;
      }

      // Build Ticker
      let ticker = {};
      for (const market in cfgTicker.markets) {
        // Build Market
        ticker[market] = {};
        for (const asset of cfgTicker.markets[market].assets) {
          // Build Asset
          ticker[market][asset] = {
            id: asset,
            name: data.assets[asset].name,
            symbol: data.assets[asset].symbol,
            rank: parseInt(data.assets[asset].rank),
            icon: "https://oberonbrokers-a404b.web.app/img/token/" + data.assets[asset].symbol + ".png",
            prices: {},
          };

          // Build Prices
          for (const rate of cfgTicker.markets[market].rates) {
            // Calculate Bid and Ask Prices
            const priceUsd = parseFloat(data.assets[asset].priceUsd);
            const rateUsd = parseFloat(data.rates[rate].rateUsd);
            const priceLocal = priceUsd / rateUsd;
            const rateSymbol = data.rates[rate].symbol;
            const currencySymbol = data.rates[rate].currencySymbol;
            const bid = (1 + cfgTicker.markets[market].markup.bid) * priceLocal;
            const ask = (1 + cfgTicker.markets[market].markup.ask) * priceLocal;

            // Do we want more or fewer decimals in our displayed price?
            let digits = 2;
            if (typeof cfgTicker.display !== "undefined") {
              if (typeof cfgTicker.display[rate] !== "undefined") {
                if (typeof cfgTicker.display[rate].decimals !== "undefined") {
                  digits = cfgTicker.display[rate].decimals;
                }
              }
            }
            if (bid < 1000 || ask < 1000) digits++;
            if (bid < 100 || ask < 100) digits++;
            if (bid < 10 || ask < 10) digits++;
            if (bid < 1 || ask < 1) digits++;

            // Update the prices object
            ticker[market][asset].prices[rateSymbol] = {
              bid:
                currencySymbol +
                " " +
                Intl.NumberFormat("en-EN", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(
                  bid
                ),
              ask:
                currencySymbol +
                " " +
                Intl.NumberFormat("en-EN", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(
                  ask
                ),
            };
          }
        }
      }

      // Add timestamp to ticker
      ticker.last = Date.now();
      ticker.error = false;
      ticker.errorMessage = "";

      // Update Database
      const db = admin.database();
      db.ref("ticker").update(ticker);
    })
    .catch((error) => {
      let ticker = {};
      ticker.error = true;
      ticker.errorMessage = error.message;

      const db = admin.database();
      db.ref("ticker").update(ticker);
    });

  return null;
});
