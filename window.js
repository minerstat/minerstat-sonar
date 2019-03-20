const {
    shell
} = require('electron');
const remote = require('electron').remote,
    electron = require('electron'),
    app = remote.app;
var fs = require('fs'),
    fullpath = app.getPath("appData");

/*
	MAIN FRAME BUTTONS
*/
document.getElementsByClassName("minimize")[0].addEventListener("click", function(e) {
    var window = remote.getCurrentWindow();
    window.minimize();
});
document.getElementsByClassName("close")[0].addEventListener("click", function(e) {
    var window = remote.getCurrentWindow();
    window.close();
});
