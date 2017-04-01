/**
 * Poor man's implementation of html5 audio
 * Author: Daniel Motles
 */

(function(globals, _, document) {
    'use strict';
    var audioctx = getAudioContext();
    var FFTSIZE = 1024;
    var volume = 0.5;

    function getAudioContext() {
        var ctxcls = globals.AudioContext || globals.webkitAudioContext || null;
        if (ctxcls === null) {
            alert("This site will not work in your browser. Please try Chrome or FireFox");
            throw new Error("Browser does not support audio contexts (HTML5?)");
        }
        return new ctxcls();
    }

    function Music(url) {
        var e = document.createElement('audio'), self = this;
        e.crossOrigin = "anonymous";
        e.style.visibility = 'hidden';
        e.style.display = 'none';
        e.src = url;
        e.volume = volume;
        document.body.appendChild(e);
        this.e = e;
        e.load();

        this.source = audioctx.createMediaElementSource(e);
        this.analyser = audioctx.createAnalyser();
        this.analyser.smoothingTimeConstant = 0.8;
        this.analyser.fftSize = FFTSIZE;
        this.analyser.minDecibels = -120.0;
        this.analyser.maxDecibels = 100.0;
        this.eqData = new globals.Float32Array(this.analyser.frequencyBinCount);
        /*this.proc = audioctx.createScriptProcessor(1024, 1, 1);
        this.proc.onaudioprocess = function() {
            self.analyser.getFloatFrequencyData(self.eqData);
        }*/
        this.source.connect(this.analyser);
        //this.analyser.connect(this.proc);
        //this.proc.connect(audioctx.destination);
        this.analyser.connect(audioctx.destination);
    }

    Music.prototype = {
        getEqData: function() {
            this.analyser.getFloatFrequencyData(this.eqData);
            return this.eqData;
        },
        play: function() {
            if(this.e.currentTime > 0.0) {
                this.e.currentTime = 0;
            }
            this.e.volume = volume;
            this.e.play();
        },
        togglePause: function() {
            if (this.e.paused) {
                this.e.volume = volume;
                this.e.play();
            } else {
                this.e.pause();
            }
        },
        pause: function() {
            this.e.pause();
        },
        onFinish: function(cb) {
            this.e.addEventListener('ended', cb, true);
        }
    };

    Music.setVolume = function(newval) {
        volume = newval;
    };

    Music.getFFTSize = function() {
        return FFTSIZE;
    };

    // return Music
    globals.Music = Music;
})(this, _, document);
