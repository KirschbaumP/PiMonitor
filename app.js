var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var schedule = require('node-schedule');
var request = require('request');
var dateFormat = require('dateformat');
dateFormat.masks.mvvurl = 'HH:MM';
var iconv = require('iconv-lite');

var ort = ["Planegg","Gr%E4felfing"];
var filter =["000010000000","111111111111"];
var url = ["http://s-bahn-muenchen.hafas.de/bin/540/bhftafel.exe/"+
    "dn?L=&rt=1&widget=yes&input=", //ort
    "&boardType=dep&" +
    "time=", //time
    "&productsFilter=",//Auswahl der Verkehrsmittel
    "&additionalTime=0&disableEquivs=yes" +
    "&maxJourneys=", //Anzahl der Zeilen
    "&outputMode=undefined&start=yes&selectDate=today&monitor=1&requestType=0"];


app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});



io.on('connection', function(socket){});

var sbahnPlanegg = schedule.scheduleJob({ rule: '*/5 * * * * *' }, function(){
    var now = new Date();
    var mvvurl = url[0] + ort[0] + url[1] + dateFormat(now, "mvvurl") + url[2] + filter[1] + url[3] + "20" + url[4];
    var result = "";
    request({
        url: mvvurl,
        json: true
    }, function (error, response, body) {

        if (!error && response.statusCode === 200) {
            var s = iconv.encode(body, 'iso-8859-1');
            var r = iconv.decode(s, 'utf8');
            io.sockets.emit("pladepature",r);
        }
    });
});

var sbahnGraefelfing = schedule.scheduleJob({ start: new Date(Date.now() + 5000), rule: '*/5 * * * * *' }, function(){
    var now = new Date();
    var mvvurl = url[0] + ort[1] + url[1] + dateFormat(now, "mvvurl") + url[2] + filter[1] + url[3] + "20" + url[4];
    var result = "";
    request({
        url: mvvurl,
        json: true
    }, function (error, response, body) {

        if (!error && response.statusCode === 200) {
            var s = iconv.encode(body, 'iso-8859-1');
            var r = iconv.decode(s, 'utf8');
            io.sockets.emit("grfdepature",r);
        }
    });
});


http.listen(3000, function(){
  console.log('listening on *:3000');
});
