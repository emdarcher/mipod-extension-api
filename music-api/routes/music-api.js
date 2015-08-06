//music-api

var restify = require('restify');
var assert = require('assert');
var url = require('url');
var httpMocks = require('node-mocks-http');

var Step = require('step');

module.exports = function( url_path ){
    var parsed_url = url.parse(url_path);
    this.mipod_api = {
        host: parsed_url.host,
        api_path: parsed_url.pathname,
        port: parsed_url.port
    };
    
    this.playTimeoutSec = 0;
    this.playTimeout;

    this.mipod_client = restify.createJsonClient({
        url: 'http://' + this.mipod_api.host
    });
    
    this.client_res_log_cb = function(err, req, res, obj){
        assert.ifError(err);
        console.log('%d -> %j', res.statusCode, res.headers);
        console.log('%j', obj);
    });

    this.play = function(req, res, next){
        //plays song
        
        //set single mode on
        this.mipod_client.get(this.mipod_api.api_path + '/single/1',
               this.client_res_log_cb(e, rq, rs, ob) ); 
            
        //stop playback before we play
        this.stop({}, httpMocks.createResponse(),function (){ 
    
        //check if they provided a secondsToPlay param, if so create
        //a timeout to to stop the song after that time.
        if(req.params.secondsToPlay !== undefined){
            this.playTimeoutSec = req.params.secondsToPlay;
            this.playTimeout = new setTimeout(
                //call stop with fake req and res
                this.stop({}, httpMocks.createResponse(), function(){} ),
                this.playTimeoutSec * 1000 ); 
        } else { this.playTimeoutSec = undefined; }
        
        //check if they provided a path, if so call play for that path
        if(req.params.songPath !== undefined){
            this.mipod_client.post(this.mipod_api.api_path + '/play',
                    { entry: req.params.songPath },
                    function ( e, rq, rs, ob) {
                        this.client_res_log_cb(e,rq,rs,ob);
                        //call current for song details     
                        this.current({}, res, next);               
                    });
        } else {
            this.mipod_client.get(this.mipod_api.api_path + '/play',
                    function ( e, rq, rs, ob) {
                        this.client_res_log_cb(e,rq,rs,ob);
                        //call current for song details     
                        this.current({}, res, next); 
                    });
        }

        });
        return next(); 
    };

    //gets the current info for the song
    this.current = function(req, res, next){
        //empty objects to store responses for parsing
        var current_info = {};
        var status_info = {};
        this.mipod_client.get(this.mipod_api.api_path + '/current',
                function(e, rq, rs, ob) {
                    this.client_res_log_cb(e, rq, rs, ob);
                    current_info = ob;
                }); 
        this.mipod_client.get(this.mipod_api.api_path + '/status',
                function(e, rq, rs, ob) {
                    this.client_res_log_cb(e, rq, rs, ob);
                    status_info = ob;
                });
        //if the status of playback is stopped then there is no current song 
        if(status_info.state == 'stop'){
            res.json(404, {error:"Nothing is playing"}); 
        } else {
            var response_info = {
                file: current_info.song.file, 
                title: current_info.song.title,
                album: current_info.song.album,
                artist: current_info.song.artist,
                lengthInSeconds: current_info.song.time,
                secondsToPlay: playTimeoutSec,
                secondsElapsed: status_info.elapsed  
            }; 
            res.json(response_info);
        }

        return next();
    };

    this.stop = function(req, res, next){
        //stops song
        this.mipod_client.get(this.mipod_api.api_path + '/stop',
                function(e, rq, rs, ob) {
                    this.client_res_log_cb(e, rq, rs, ob);
                    if(!e){
                        res.json({message:"stopped current song"}); 
                    } else { res.json(500); }
                });
        return next();
    };
    this.pause = function(req, res, next){
        //pauses song 
        this.mipod_client.get(this.mipod_api.api_path + '/pause',
                function(e, rq, rs, ob) {
                    this.client_res_log_cb(e, rq, rs, ob);
                    if(!e){
                        res.json({message:"paused current song"}); 
                    } else { res.json(500); }
                });
        return next();
    };

};
