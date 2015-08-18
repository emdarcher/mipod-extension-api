#!/usr/bin/env node

//creates a linux service for server

var Service = require('node-linux').Service;

//use PORT variable passed from the shell or 7474
var port = process.env.PORT || 7474;

var svc = new Service({
    name:'musicapisvc',
    description: 'The music api server',
    script:require('path').join(__dirname, 'server.js'),
    env: [{
        name: "PORT",
        value: port
    }]
});

svc.on('install', function(){
    svc.start();
    console.log('installed and started service');
    console.log('The service exists: ', svc.exists);
});

svc.on('uninstall', function(){
    console.log('uninstall complete.');
    console.log('The service exists: ', svc.exists);
});

svc.on('start', function(){
    console.log(svc.name + ' started!');
});

svc.on('error', function(err){
    console.log('ERROR: ', err);
});

var options_str = 'options:\t--help\n\t--install\n\t--uninstall';

if(process.argv[2] !== undefined){
    if(process.argv[2] == '--install'){
        svc.install();
    } else if(process.argv[2] == '--uninstall'){
        svc.uninstall();
    } else if(process.argv[2] == '--help'){
        console.log(options_str);
    }
} else {
    console.log(options_str);
}

