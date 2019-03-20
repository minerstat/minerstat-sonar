const {
    shell
} = require('electron');
const remote = require('electron').remote,
    electron = require('electron'),
    app = remote.app;
var fs = require('fs'),
    fullpath = app.getPath("appData");
