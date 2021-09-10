// Connect to the Database
var firebaseConfig = {
    apiKey: "AIzaSyAU2V-lF-YdzHGnGtATIX1c1ORnoDMk7q4",
    authDomain: "oberonbrokers-a404b.firebaseapp.com",
    databaseURL: "https://oberonbrokers-a404b-default-rtdb.firebaseio.com",
    projectId: "oberonbrokers-a404b",
    storageBucket: "oberonbrokers-a404b.appspot.com",
    messagingSenderId: "149254453015",
    appId: "1:149254453015:web:a9e9179ca7be39d1d32952",
    measurementId: "G-72XS709Z0T"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Initial Variables
let market = 'panama';

 // Build Table
let div = $("div#ticker")
let table = $('<table>').addClass('ticker').addClass('table').addClass('table-striped')
let thead = $('<thead>')
let tbody = $('<tbody>')
let tfoot = $('<tfoot>')
div.append(table)
table.append(thead)
table.append(tbody)
table.append(tfoot)

// Table Header
thead.append('<tr><th>Moneda</th><th>Unidad</th><th>Moneda</th><th class="text-right">Bid</th><th class="text-right">Ask</th></tr>')

// Table Footer
tfoot.append(
    '<tr>' + 
    '<td id="ticker_updated" colspan="4">Última actualización: ' + Date() + '</td>' +
    '</tr>')

// Table Body
let ticker = []
db.ref('ticker/' + market).orderByChild('rank').on('value', (snapshot) => {
    
    let content = ''
    snapshot.forEach((coin) => {
        let data = coin.val();
        let symbol = data.symbol;
       
        console.log(symbol);
        // Table Rows
        content += '<tr>'
        content += '<td><img style="height: 2em;" src="img/tokens/' + symbol + '.png" alt="' + data.name + '"/> ' + data.name + '</td>'
        content += '<td>1 ' + symbol + '</td>'

        content += '<td>'
        for (price of Object.keys(data.prices)) {
            let key = price;
            content += key + '<br/>'
        }
        content += '</td>'
        content += '<td class="text-right">'
        for (price of Object.keys(data.prices)) {
            let key = price;
            content += data.prices[key].bid + '<br/>'
        }
        content += '</td>'
        content += '<td class="text-right">'
        for (price of Object.keys(data.prices)) {
            let key = price;
            content += data.prices[key].ask + '<br/>'
        }
        content += '</td>'
        content += '</tr>'
    });
    tbody.html(content)
    
    let event = new Date()
    $('#ticker_updated').text('Última actualización: ' + event.toLocaleString())

})
