/*
  minerstat Sonar
  Backend module
*/
const tcpp = require('tcp-ping');
var id = require('node-machine-id');
var machine_ID = id.machineIdSync();
var waiting_LIST = [];
var busy = false;
var currentProc = 0;

window.onerror = function(msg, url, linenumber) {
    alert('Error message: ' + msg + '\nURL: ' + url + '\nLine Number: ' + linenumber);
    return true;
}

// UI
var mainButton = document.getElementById("mainButton");
var statusIcon = document.getElementById("statusIcon");
var statusText = document.getElementById("statusText");

// SOCKET
var socket = io('https://minerstat.com:2083');

function sendMessage(m) {
    socket.send(m);
    console.log("OUTGOING JSON: %s", m);
}

function processList() {
    var linterval = setInterval(function() {
        try {
            if (currentProc == 5) {
                busy = true;
            }
            if (currentProc == 0) {
                busy = false;
            }
            if (waiting_LIST.length > 0) {
                currentProc++;
                var json = waiting_LIST[0];
                var json = JSON.parse(json);
                pingTCP(json["pool"], json["port"], json["current"], json["max"], json["callback"]);
                if (currentProc == json["max"] && currentProc < 5) {
                    busy = true;
                }
                waiting_LIST.splice(0, 1);
            }
            if (waiting_LIST.length == 0 && currentProc == 0) {
                if (busy == false) {
                    clearInterval(linterval);
                    statusIcon.classList.remove("scanning");
                    statusText.innerHTML = "Connected";
                    setTimeout(function() {
                        // Reload after 18 sec idle and no job (new ID)
                        if (busy == false && currentProc == 0) {
                            location.reload();
                        }
                    }, 18000);
                }
            }
        } catch (loerr) {
            alert(loerr);
        }
    }, 200);
}

function pingTCP(a, b, current, cmax, bID) {
    var exe = 0,
        sent = 0;
    tcpp.ping({
        address: a,
        port: b,
        attempts: 10,
        timeout: 10000
    }, function(err, data) {
        //console.log("---------------------");
        //console.log(data);
        //console.log(err);
        if (exe == 0) {
            exe++;
            try {
                var resultBuild = {};
                var min = -1;
                var maxx = -1;
                var med = -1;
                var sortedArray = null;

                try {
                    var mArray = [];
                    for (var k in data.results) {
                        if (!isNaN(data.results[k]["time"])) {
                            mArray.push(data.results[k]["time"]);
                        } else {
                            mArray.push(-1);
                        }
                    }
                    sortedArray = mArray.sort(function(a, b) {
                        return a - b
                    });
                    resultBuild.med = sortedArray[4].toFixed(0);
                } catch (maxerr) {
                    resultBuild.med = -1;
                }

                try {
                    min = data.min.toFixed(0);
                } catch (minerr) {}
                try {
                    maxx = data.max.toFixed(0);
                } catch (maxerr) {}

                if (sortedArray != null) {
                    if (min == -1) {
                        try {
                            for (var i = 0; i < sortedArray.length; i++) {
                                if (sortedArray[i] === -1) {
                                    sortedArray.splice(i, 1);
                                }
                            }
                            min = sortedArray[0].toFixed(0);
                        } catch (err) {
                            min = -1;
                        }
                    }
                    if (maxx == -1) {
                        try {
                            for (var i = 0; i < sortedArray.length; i++) {
                                if (sortedArray[i] === -1) {
                                    sortedArray.splice(i, 1);
                                }
                            }
                            var newL = sortedArray.length - 1;
                            maxx = sortedArray[newL].toFixed(0);
                        } catch (err) {
                            maxx = -1;
                        }
                    }
                }

                //alert(JSON.stringify(data));
                //alert(json.min);
                resultBuild.pool = a + ':' + b;
                resultBuild.min = min;
                resultBuild.max = maxx;

                //alert(resultBuild);
                if (!isNaN(min)) {
                    //alert(" sent " - resultBuild);
                    if (exe == 1) {
                        sendEmit("submit", bID + "|" + JSON.stringify(resultBuild));
                        sent = 1;
                        busy = false;
                        if (currentProc > 0 && currentProc <= 5) {
                            currentProc--;
                        }
                    }
                }
            } catch (berr) {
                //console.log(berr);
                if (sent == 0) {
                    var poolname = a + ":" + b;
                    sendEmit("submit", bID + '|{"pool":"' + poolname + '","med":"-1","min":"-1","max":"-1"}');
                    busy = false;
                    if (currentProc > 0 && currentProc <= 5) {
                        currentProc--;
                    }
                }
            }

        }
    });
}

function sendEmit(m, e) {
    socket.emit(m, e);
    console.log("OUTGOING JSON: %s %s", m, e);
}

function IsJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

socket.on('connect', function() {
    sendMessage('subscribe:' + machine_ID);
    socket.on('message', function(message) {
        var json = null;
        var jsonDecode = null;

        try {
            json = JSON.stringify(message);
        } catch (jerr) {}

        try {
            jsonDecode = JSON.parse(message);
        } catch (jerr) {}

        var method = null;
        if (jsonDecode != null) {
            method = "" + jsonDecode.method;
        }

        // COMMANDS
        if (typeof method !== 'undefined' && method == "sonar.pong") {
            //machine_ID = jsonDecode.uuid;
            mainButton.classList.remove("disabled");
            statusIcon.classList.remove("disconnected");
            statusIcon.classList.remove("scanning");
            statusIcon.classList.add("connected");
            mainButton.setAttribute("onClick", "shell.openExternal('https://minerstat.com/sonar/" + machine_ID + "')");
            statusText.innerHTML = "Connected";
        }
        // COMMANDS
        if (json.indexOf("pools") > -1 || message.toString().indexOf("|") > -1) {
            statusIcon.classList.add("scanning");
            statusText.innerHTML = "Scanning";
            var prefixID = message.split("|");
            var current = 1;
            var message = JSON.stringify(prefixID[1]);
            var message = message.replace(/\\/g, "");
            var message = JSON.parse(prefixID[1]);
            for (var k in message.pools) {
                var pool = "" + message.pools[k],
                    prefix = pool.split(":"),
                    max = message.pools.length;
                try {
                    var jvar = {
                        "pool": prefix[0],
                        "port": prefix[1],
                        "current": current,
                        "max": max,
                        "callback": prefixID[0]
                    };
                    waiting_LIST.push(JSON.stringify(jvar));
                    current++;
                } catch (perr) {}

            }
            if (busy == false) {
                processList();
            }
        }
    });
});

socket.on('event', function(data) {});

socket.on('disconnect', function() {
    mainButton.classList.add("disabled");
    statusIcon.classList.add("disconnected");
    statusIcon.classList.remove("connected");
    statusIcon.classList.remove("scanning");
    statusText.innerHTML = "Disconnected";
    mainButton.setAttribute("onClick", "");
    //firstInit();
    location.reload();
});


//firstInit();
