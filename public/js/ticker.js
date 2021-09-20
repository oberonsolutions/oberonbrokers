const strings = {
    "en": {
        "coin": "Coin",
        "unit": "Unit",
        "currency": "Currency",
        "bid": "Bid",
        "ask": "Ask",
        "lastUpdated": "Last updated: ",
        "outdated": "Prices may be outdated. Please confirm with our brokers."
    },
    "es": {
        "coin": "Moneda",
        "unit": "Unidad",
        "currency": "Moneda",
        "bid": "Bid",
        "ask": "Ask",
        "lastUpdated": "Última actualización: ",
        "outdated": "Los precios pueden estar desactualizados. Confirme con neustros brokers."
    }
}

const tickerStart = (firebaseConfig, market, language) => {

    let last = 0;

    // Connect to Database
    firebase.initializeApp(firebaseConfig);
    const db = firebase.database();

    let div = $("div#ticker")

    // Build Warning
    let warn = $("<div>").addClass('alert').addClass('alert-warning').text(strings[language].outdated).hide();
    div.append(warn);

    // Build Table
    let card = $('<div>').addClass('card');
    let table = $('<table>').addClass('ticker').addClass('table').addClass('table-striped')
    let thead = $('<thead>')
    let tbody = $('<tbody>')
    let tfoot = $('<tfoot>')
    card.append(table)
    table.append(thead)
    table.append(tbody)
    table.append(tfoot)
    div.append(card);

    // Table Header
    thead.append('<tr><th>' + strings[language].coin + '</th>' +
        '<th>' + strings[language].unit + '</th>' +
        '<th>' + strings[language].currency + '</th>' +
        '<th class="text-right">' + strings[language].bid + '</th>' +
        '<th class="text-right">' + strings[language].ask + '</th></tr>')

    // Table Footer
    tfoot.append(
        '<tr>' +
        '<td id="ticker_updated" colspan="4">' + strings[language].lastUpdated + '</td>' +
        '</tr>')

    // Table Body
    let ticker = []
    db.ref('ticker').on('value', (snapshot) => {
        let data = snapshot.val();
        last = data.last;

        let content = '';

        // Sort the coin data
        let rows = [];
        for (const coin in data[market]) {
            const coinData = data[market][coin];
            rows[coinData.rank] = coinData;
        }

        // Build Table
        rows.forEach(row => {

            // Table Rows
            content += '<tr>'
            content += '<td><img style="height: 2em;" src="' + row.icon + '" alt="' + row.name + '"/> ' + row.name + '</td>'
            content += '<td>1 ' + row.symbol + '</td>'

            content += '<td>'
            for (price of Object.keys(row.prices)) {
                let key = price;
                content += key + '<br/>'
            }
            content += '</td>'
            content += '<td class="text-right">'
            for (price of Object.keys(row.prices)) {
                let key = price;
                content += row.prices[key].bid + '<br/>'
            }
            content += '</td>'
            content += '<td class="text-right">'
            for (price of Object.keys(row.prices)) {
                let key = price;
                content += row.prices[key].ask + '<br/>'
            }
            content += '</td>'
            content += '</tr>'
        })

        // Display the table
        tbody.html(content)
        let event = new Date(last);
        $('#ticker_updated').text(strings[language].lastUpdated + event.toLocaleString())

    });

    let lastTimer = window.setInterval(() => {
        let now = Date.now();
        if (now - last >= 5 * 60 * 1000) {
            warn.show();
        } else {
            warn.hide();
        }
    }, 1000);
}