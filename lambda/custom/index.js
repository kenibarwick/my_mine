// 1. Text strings =====================================================================================================
//    Modify these strings and messages to change the behavior of your Lambda function

// 2. Skill Code =======================================================================================================


var Alexa = require('alexa-sdk');

exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);

    alexa.appId = 'amzn1.ask.skill.8a040313-6b2e-4855-a663-5c0eefc82fc7';
    alexa.dynamoDBTableName = 'my_mine'; // creates new table for session.attributes

    alexa.registerHandlers(handlers);
    alexa.execute();
};

var handlers = {
    'LaunchRequest': function () {
        this.emit('LaunchMyMine');
    },
    'GetStatsIntent': function () {
        this.emit('SayStatus');
    },
    'SayStatus': function () {
    
        var statusIntent = this.event.request.intent.slots.stat.value;
    
        httpsGet(statusIntent,  (myResult) => {
            console.log("sent     : " + statusIntent);
            console.log("received : " + myResult);

            speachOutput = formatSpeach(statusIntent, myResult);
            var deviceId = this.event.context.System.device.deviceId;
            this.response.cardRenderer(deviceId, speachOutput, "https://avatars0.githubusercontent.com/u/20253748");

            this.response.speak(speachOutput);
            this.emit(':responseReady');

            }
        );
    },
    'LaunchMyMine': function () {
        
    },
    'SessionEndedRequest' : function() {
        console.log('Session ended with reason: ' + this.event.request.reason);
    },
    'AMAZON.StopIntent' : function() {
        this.response.speak('Bye');
        this.emit(':responseReady');
    },
    'AMAZON.HelpIntent' : function() {
        this.response.speak("You can try: 'alexa, my mine' or 'alexa, ask my mine for my average hashrate'");
        this.emit(':responseReady');
    },
    'AMAZON.CancelIntent' : function() {
        this.response.speak('Bye');
        this.emit(':responseReady');
    },
    'Unhandled' : function() {
        this.response.speak("Sorry, I didn't get that. You can try: 'alexa, hello world'" +
            " or 'alexa, ask hello world my name is awesome Aaron'");
    }
};


//    END of Intent Handlers {} ========================================================================================
// 3. Helper Function  =================================================================================================


var https = require('https');
// https is a default part of Node.JS.  Read the developer doc:  https://nodejs.org/api/https.html
// try other APIs such as the current bitcoin price : https://btc-e.com/api/2/btc_usd/ticker  returns ticker.last

function httpsGet(myData, callback) {

    // GET is a web service request that is fully defined by a URL string
    // Try GET in your browser:
    // https://cp6gckjt97.execute-api.us-east-1.amazonaws.com/prod/stateresource?usstate=New%20Jersey


    // Update these options with the details of the web service you would like to call
    var options = {
        host:'api-etc.ethermine.org',
        port: 443,
        path: '/miner/' + getMine() + '/currentStats',
        method: 'GET',

        // if x509 certs are required:
        // key: fs.readFileSync('certs/my-key.pem'),
        // cert: fs.readFileSync('certs/my-cert.pem')
    };

    var req = https.request(options, res => {
        res.setEncoding('utf8');
        var returnData = "";

        res.on('data', chunk => {
            returnData = returnData + chunk;
        });

        res.on('end', () => {
            // we have now received the raw return data in the returnData variable.
            // We can see it in the log output via:
            // console.log(JSON.stringify(returnData))
            // we may need to parse through it to extract the needed data

            var pop = returnData; //JSON.parse(returnData).data.averageHashrate;

            callback(pop);  // this will execute whatever function the caller defined, with one argument

        });

    });
    req.end();

}

function formatSpeach(statusIntent, myResult) {
    var speachOutput = '';
    var status = '';
    var statusValue = 0;

    switch (statusIntent) {
        case "reported Hashrate":
        ({ status, statusValue } = formatValue(status, myResult, statusIntent, statusValue));
        speachOutput = 'The ' + statusIntent + ' is ' + statusValue.toFixed(2); 
        break;
        case "current Hashrate":
        ({ status, statusValue } = formatValue(status, myResult, statusIntent, statusValue));        
        speachOutput = 'The ' + statusIntent + ' is ' +  statusValue.toFixed(2); 
        break;
        case "average Hashrate":
        ({ status, statusValue } = formatValue(status, myResult, statusIntent, statusValue));        
        speachOutput = 'The ' + statusIntent + ' is ' +  statusValue.toFixed(2); 
        break;
        case "unpaid":
        ({ status, statusValue } = formatValue(status, myResult, statusIntent, statusValue));        
        speachOutput = 'The ' + statusIntent + ' is ' + (parseFloat(status)/1000000000000000000).toPrecision(2) + ' E.T.C.';  
        break;
        case "next coin":
        case "next payout":
        ({ status, statusValue } = formatValue(status, myResult, "unpaid", statusValue));  
        var unpaid = (parseFloat(status)/1000000000000000000).toPrecision(2);
        console.log("unpaid     : " + unpaid);
        ({ status, statusValue } = formatValue(status, myResult, "coinsPerMin", statusValue));
        var coinsPerMin = status;
        console.log("coinsPerMin     : " + coinsPerMin);
        var nextCoininHours = ((1-unpaid)/coinsPerMin) / 60;
        var nextCoininMinutes =  ((1-unpaid)/coinsPerMin);
        var nextCoinSpeach;
        var unit;
        if (nextCoininHours<0) {
            nextCoinSpeach = parseFloat(nextCoininMinutes).toFixed(0);
            unit = ' minutes';
        }
        else {
            nextCoinSpeach = parseFloat(nextCoininHours).toFixed(0);
            unit = ' hours';
        }
        speachOutput = 'The ' + statusIntent + ' is in ' + nextCoinSpeach + unit; 
        break;
        case "status":
        speachOutput = 'The mine status is ' + JSON.parse(myResult).status;
        break;
        case "daily dollar estimate":
        ({ status, statusValue } = formatValue(status, myResult, "usdPerMin", statusValue));
        var usdPerMin = status;
        var usdPerDay = (usdPerMin * 60) * 24;
        speachOutput = 'The ' + statusIntent + ' is $' + usdPerDay.toFixed(2);        
        break;
        default:
        speachOutput = 'The status is ' + JSON.parse(myResult).status;        
        break;
    }

    console.log(speachOutput);

    return speachOutput;
}

function formatValue(status, myResult, statusIntent, statusValue) {
    status = JSON.parse(myResult).data[statusIntent.replace(/\s+/g, '')];
    statusValue = parseFloat(status) / 1000000;
    return { status, statusValue };
}

function getMine() {
    var AWS = require("aws-sdk");

    AWS.config.update({region: "us-east-1", endpoint: "https://dynamodb.us-east-1.amazonaws.com"});

    var docClient = new AWS.DynamoDB.DocumentClient();
    var table = "my_mine";
    var params = {
        TableName: table,
        Key:{
            "deviceID": "AEPJHGQDRIK25QQKR4EOZ6CP4XJ2C4NY3PXWZ4OCXZJD3F2MXWHBMJPZZLIS44ELJ2A5IYJJVKQNXBRG5DC2YZA7KJ4BWPF2GFD3ERSZNAX4FMITCXHEDZPWH3ODUASZ3MGKRTZTPNPZYA6XCZZKZO6TIRXA"
        }
    };

    docClient.get(params, function(err, data) {
        if (err) {
            console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            var mineAddress = JSON.stringify(data.Item.info.MineAddress, null, 2);
            console.log("GetItem succeeded:", mineAddress);
            return mineAddress;
        }
    });

}