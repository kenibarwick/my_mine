var AWS = require("aws-sdk");
var fs = require('fs');

AWS.config.update({region: "us-east-1", endpoint: "https://dynamodb.us-east-1.amazonaws.com"});

var docClient = new AWS.DynamoDB.DocumentClient();

console.log("Importing device data into DynamoDB. Please wait.");

var allDevices = JSON.parse(fs.readFileSync('data.json', 'utf8'));
allDevices.forEach(function(devices) {
    var params = {
        TableName: "my_mine",
        Item: {
            "deviceID":  devices.deviceID,
            "info" : devices.info
        }
    };

    docClient.put(params, function(err, data) {
       if (err) {
           console.error("Unable to add device", devices.deviceID, ". Error JSON:", JSON.stringify(err, null, 2));
       } else {
           console.log("PutItem succeeded:", devices.deviceID);
       }
    });
});
