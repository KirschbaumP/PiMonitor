var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var schedule = require('node-schedule');
var request = require('request');
var dateFormat = require('dateformat');
dateFormat.masks.mvvurl = 'HH:MM';
var iconv = require('iconv-lite');

var ort = ["Planegg", "Gr%E4felfing"];
var filter = ["000010000000", "111111111111"];
var url = ["http://s-bahn-muenchen.hafas.de/bin/540/bhftafel.exe/" +
"dn?L=&rt=1&widget=yes&input=", //ort
    "&boardType=dep&" +
    "time=", //time
    "&productsFilter=",//Auswahl der Verkehrsmittel
    "&additionalTime=0&disableEquivs=yes" +
    "&maxJourneys=14", //Anzahl der Zeilen
    "&outputMode=undefined&start=yes&selectDate=today&monitor=1&requestType=0"];


app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/style.css', function (req, res) {
    res.sendFile(__dirname + '/style.css');
});


app.get('/kurs/:id/:title/:geld/:brief/:time', function (req, res) {
    var data = {
        id: req.params.id,
        title: req.params.title,
        geld: req.params.geld,
        brief: req.params.brief,
        time: req.params.time,
    }
    if (data.id > 3 || data.id < 0) {
        res.json({status: "id darf nur die Werte 0, 1, 2, 3 annehmen"});
    }
    else {
        io.sockets.emit("boerse", data);
        res.json({status: "ok"});
    }
});

io.on('connection', function (socket) {
});

var sbahnGraefelfing = schedule.scheduleJob({start: new Date(Date.now() + 1000), rule: '*/5 * * * * *'}, function () {
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
            io.sockets.emit("grfdepature", r);
        }
    });
});


http.listen(3000, function () {
    console.log('listening on *:3000');
});
