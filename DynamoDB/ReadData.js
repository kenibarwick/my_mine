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
        console.log("GetItem succeeded:", JSON.stringify(data.Item.info.MineAddress, null, 2));
    }
});
