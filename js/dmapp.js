/**
 * A music player app.
 * Author: Daniel Motles
 * This software re-uses code provided on threejs.org in the interactive cubes example.
 * It has been heavily modified, but is still close enough to to the original
 * That I thought I'd mention it to not get in trouble.
 */

(function() {
    var DMOTLES_ID = 27794941;  // soundcloud user id to poll

    function ajax_request(config) {
        var r = new XMLHttpRequest();
        r.open(
            'GET' || config.method,
            config.url,
            true // async
        );
        r.onreadystatechange = function() {
            if (r.readyState === 4) {
                config.ondone(r)
            }
        }
        for (header in config.headers) {
            if (config.headers.hasOwnProperty(header)) {
                r.setRequestHeader(header, config.headers[header])
            }
        }
        if (_.isUndefined(config.data)) {
            r.send()
        } else {
            r.send(config.data)
        }
    }


    function SimpleSoundCloud(clientid) {
        this.clientid = clientid;
    }

    SimpleSoundCloud.prototype = {
        url: function(endpoint, data) {
            var urlparts = [
                '//api.soundcloud.com/',
                endpoint,
                '?client_id=',
                this.clientid
            ];
            if (_.isObject(data)) {
                _.each(data, function(value, key) {
                    urlparts.push(
                        '&',
                        encodeURIComponent(key),
                        '=',
                        encodeURIComponent(value)
                    );
                });
            }
            return urlparts.join('')
        },
        resolve: function(url, cb) {
            ajax_request({
                url: this.url('resolve.json', {url: url}),
                ondone: cb
            });
        },
        likes: function(userid, cb) {
            ajax_request({
                url: this.url([
                    'users',
                    userid.toString(),
                    'favorites.json'
                ].join('/')),
                ondone: cb
            });
        },
        stream_url: function(url) {
            return url + '?client_id=' + this.clientid;
        },
        _testlikes: function(userid, cb) {
            ajax_request({
                url: '/json/favorites.json',
                ondone: cb
            });
        }
    }


    function MusicPlayer(likes, sc) {
        this.likes = likes;
        this.likeid = 0
        this.sc = sc;
        this._music_items = new Array(likes.length - 1);
        for (var i = 0; i < likes.length; i++) {
            this._music_items[i] = null;
        }
        this._last_playing = null;
    }

    MusicPlayer.prototype = {
        curmusic: function() {
            var self = this, music = this._music_items[this.likeid];
            if (_.isNull(music)) {
                music = new Music(this.curstreamurl());
                music.onFinish(function() {
                    self.next();
                });
                this._music_items[this.likeid] = music;
            }
            return music;
        },
        curstreamurl: function() {
            var cur_choice = this.likes[this.likeid];
            return this.sc.stream_url(cur_choice.stream_url);
        },
        next: function() {
            this.curmusic().pause();
            if (this.likeid >= this.likes.length) {
                this.likeid = 0;
            } else {
                this.likeid++;
            }
            var music = this.curmusic();
            music.play();
        },
        prev: function() {
            this.curmusic().pause();
            if (this.likeid <= 0) {
                this.likeid = this.likes.length - 1;
            } else {
                this.likeid--;
            }
            var music = this.curmusic();
            music.play();
        },
        togglePlay: function() {
            var music = this.curmusic();
            music.togglePause();
        },
        handleEvent: function(event) {
            is_event_toggle = (
                event.type === 'keyup' && event.keyCode === 0x20
            ) || (
            event.type === 'mouseup'
            ) || (
            event.type === 'touchup'
            );
            if (is_event_toggle) {
                this.togglePlay();
                return;
            }
            is_next_event = event.type === 'keyup' && event.keyCode === 39;
            if (is_next_event) {
                this.next();
                return;
            }
            is_prev_event = event.type === 'keyup' && event.keyCode === 37;
            if (is_prev_event) {
                this.prev();
                return;
            }
        },
        getWaveformData: function() {
            return this.curmusic().getEqData();
        },
        isPlaying: function() {
            return true;
        }
    }


    function demo_3js(music) {
        var container;
        var camera, renderer, scene;

        var num_objects = (Music.getFFTSize() / 2) * 0.8;
        var visualizer_radius = 400;

        var radius = 300, theta = 0;
        var meshes = [], play_pos = [];
        var ZERO = [0, 0, 0];

        init();
        animate();

        function random_point_on_sphere(radius) {
            // http://mathworld.wolfram.com/SpherePointPicking.html
            var theta = 2*Math.PI*Math.random(),
            phi = Math.acos(2*Math.random() - 1);
            var x = radius * Math.sin(phi) * Math.cos(theta),
            y = radius * Math.sin(phi) * Math.sin(theta),
            z = radius * Math.cos(phi);
            return [x, y, z];
        }


        function init() {

            container = document.createElement( 'div' );
            document.body.appendChild( container );

            camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 10000 );

            scene = new THREE.Scene();


            var light = new THREE.DirectionalLight( 0xffffff, 1 );
            light.position.set( 1, 1, 1 ).normalize();
            scene.add( light );
            light = new THREE.DirectionalLight( 0xffffff, 1 );
            light.position.set( -1, -1, -1 ).normalize();
            scene.add( light );

            var geometry = new THREE.BoxGeometry( 20, 20, 20 );

            for (var i = 0; i < num_objects; i++) {
                var object = new THREE.Mesh(
                    geometry,
                    new THREE.MeshLambertMaterial({color: Math.random() * 0xffffff })
                );

                object.rotation.x = Math.random() * 2 * Math.PI;
                object.rotation.y = Math.random() * 2 * Math.PI;
                object.rotation.z = Math.random() * 2 * Math.PI;

                object.scale.x = Math.random() + 0.5;
                object.scale.y = Math.random() + 0.5;
                object.scale.z = Math.random() + 0.5;

                scene.add(object);
                meshes.push(object);
                play_pos.push(random_point_on_sphere(visualizer_radius));
            }

            renderer = new THREE.WebGLRenderer();
            renderer.setClearColor(0xf0f0f0);
            renderer.setSize( window.innerWidth, window.innerHeight );
            renderer.sortObjects = false;
            container.appendChild(renderer.domElement);
            window.addEventListener( 'resize', onWindowResize, false );
        }

        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize( window.innerWidth, window.innerHeight );
        }


        function animate() {
            requestAnimationFrame(animate);
            render();
        }

        function get_intensity(value) {
            // value is negative. largest intensity is 0. minimum is -120, but can fall below
            // -120 when the song is paused/stopped.
            value = Math.max(-120.0, value);
            return ((value + 120.0) / 120.0) + 0.2
        }

        function render() {
            var wvdata = music.getWaveformData();
            theta += 0.1;
            camera.position.x = radius * Math.sin( THREE.Math.degToRad( theta ) );
            camera.position.y = radius * Math.sin( THREE.Math.degToRad( theta ) );
            camera.position.z = radius * Math.cos( THREE.Math.degToRad( theta ) );
            camera.lookAt( scene.position );
            for (var i = 0; i < meshes.length; i++) {
                var mesh = meshes[i], intensity = get_intensity(wvdata[i]);
                mesh.position.fromArray(play_pos[i]);
                mesh.position.multiplyScalar(intensity);
            }

            renderer.render( scene, camera );
        }

    }

    var sc = new SimpleSoundCloud('d6de0043ca8b2163688482b2bfff11d9');
    function debug(xhr) {
        var dbgnode = document.getElementById('dbg');
        var text = [
            'status: ' + xhr.status.toString(),
            'rtype: ' + xhr.responseType,
            'rtext: ' + xhr.responseText
        ].join('\n--\n');
        console.log(text);
        var container = document.createElement('div');
        var pretag = document.createElement('pre');
        var textnode = document.createTextNode(text);
        pretag.appendChild(textnode);
        container.appendChild(pretag);
        dbgnode.appendChild(container);
    }
    function on_likes_response(xhr) {
        //debug(xhr);
        var likesjson = JSON.parse(xhr.responseText);
        var likes = _.shuffle(
            _.filter(likesjson, function(like) {
                return like.kind === 'track' && like.streamable;
            })
        );
        var mp = new MusicPlayer(likes, sc);
        window.document.addEventListener('keyup', mp);
        window.document.addEventListener('mouseup', mp);
        window.document.addEventListener('touchup', mp);
        mp.togglePlay();
        demo_3js(mp);
    }
    //sc._testlikes(DMOTLES_ID, on_likes_response);
    sc.likes(DMOTLES_ID, on_likes_response);

})();

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
