const express = require('express')
const app = express()


//set the template engine ejs
app.set('view engine', 'ejs')

//middlewares
app.use(express.static('public'))


//routes
app.get('/', (req, res) => {
	res.render('index')
})

//Listen on port 3000
server = app.listen(3000)



//socket.io instantiation
const io = require("socket.io")(server)


//listen on every connection
io.on('connection', (socket) => {
	console.log('New user connected')

	//default username
	socket.username = "Anonymous"

    //listen on change_username
    socket.on('change_username', (data) => {
        socket.username = data.username
    })

    //listen on new_message
    socket.on('new_message', (data) => {
        if(data.message.trim()!="")
        {
            //broadcast the new message
            io.sockets.emit('new_message', {message : data.message, username : socket.username});
            // Pass an utterance to the sample LUIS app
            getLuisIntent(data.message);
        }
    });

    //listen on typing
    socket.on('typing', (data) => {
    	socket.broadcast.emit('typing', {username : socket.username})
    });
});

let request = require('request');
let querystring = require('querystring');
require('custom-env').env();

// Analyze text
//
// utterance = user's text
//
function getLuisIntent(utterance) {

    // endpoint URL
    let endpoint =
        "https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/";

    // Set the LUIS_APP_ID environment variable
    // to df67dcdb-c37d-46af-88e1-8b97951ca1c2, which is the ID
    // of a public sample application.
    let luisAppId = process.env.LUIS_APP_ID;

    // Read LUIS key from environment file ".env"
    // You can use the authoring key instead of the endpoint key.
    // The authoring key allows 1000 endpoint queries a month.
    let endpointKey = process.env.LUIS_ENDPOINT_KEY;
           
    // Create query string
    let queryParams = {
        "verbose":  true,
        "q": utterance,
        "subscription-key": endpointKey
    }

    // append query string to endpoint URL
    let luisRequest =
        endpoint + luisAppId +
        '?' + querystring.stringify(queryParams);

    // HTTP Request
    request(luisRequest,
        function (err, response, body) {

            // HTTP Response
            if (err)
                console.log(err);
            else {
                let data = JSON.parse(body);

                console.log(data);
                console.log(`Top Intent: ${data.topScoringIntent.intent}`);
                console.log(JSON.stringify(data.intents[0].intent));

                let louisSay = 'You reached the '+JSON.stringify(data.intents[0].intent+'. You said \'' + utterance+'\'');
                io.sockets.emit('new_message', {message : louisSay, username : 'Bot'});

            }
        });

}


