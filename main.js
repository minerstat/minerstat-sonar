/*
	DEPENDENCIES
*/
var path = require('path'),
	  url = require('url'),
    colors = require('colors');

/*
	ELECTRON (GUI)
*/
	const electron = require('electron'),
    app = electron.app;

    process.on('uncaughtException', function(err) {
    console.log(colors.grey('NOTICE => %s'), err);
    // This is only for Ubuntu / Linux
    // Read about: ulimit -n
    if (err.toString().includes("EMFILE") && err.toString().includes("ENFILE")) {
    	console.log("SYSTEM ERROR => Please set ulimit -n (nofile) to unlimited.");
    }
	});
	process.on('unhandledRejection', (reason, promise) => {
    console.log(colors.grey('WARNING => %s %s'), reason.stack);
	})

	const BrowserWindow = electron.BrowserWindow,
          fullpath = app.getPath("appData");
    let   mainWindow;

    function createWindow() {
        // Create the browser window.
        mainWindow = new BrowserWindow({
            width: 300,
            height: 360,
            maxWidth: 320,
            maxHeight: 360,
            minWidth: 320,
            minHeight: 360,
            frame: false,
            "fullscreen": false,
            "kiosk": false,
            "resizable": false,
            "web-preferences": {
                "web-security": false
            },
            icon: path.join(__dirname, 'asset/96x96.png')
        })
        // Show Debug Tools
        //mainWindow.webContents.openDevTools()
        // and load the index.html for minerstat.
        mainWindow.loadURL(url.format({
            pathname: path.join(__dirname, 'www/index.html'),
            protocol: 'file:',
            slashes: true
        }))
        // reload the window when crashed.
        mainWindow.webContents.on('crashed', () => {
            mainWindow.reload();
        });
        // Emitted when the window is closed.
        mainWindow.on('closed', function() {
            // Dereference the window object, usually you would store windows
            // in an array if your app supports multi windows, this is the time
            // when you should delete the corresponding element.
            mainWindow = null
        })
    }
    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    app.on('ready', createWindow)
    // Quit when all windows are closed.
    app.on('window-all-closed', function() {
        // On OS X it is common for applications and their menu bar
        // to stay active until the user quits explicitly with Cmd + Q
        //if (process.platform !== 'darwin') {
        app.quit()
        //}
    })
    app.on('browser-window-created', function(e, window) {
        window.setMenu(null);
    });
    app.on('activate', function() {
        // On OS X it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (mainWindow === null) {
            createWindow()
        }
    })

		//sonar.init();
