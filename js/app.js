var DMOTLES_ID = 27794941;
var scene;

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
    }
}


function MusicPlayer(likes, sc) {
    this.likes = likes;
    this.likeid = 0
    this.sc = sc;
    this._last_playing = null;
}

MusicPlayer.prototype = {
    curid: function() {
        var cur_choice = this.likes[this.likeid];
        return cur_choice.id.toString();
    },
    curstreamurl: function() {
        var cur_choice = this.likes[this.likeid];
        return this.sc.stream_url(cur_choice.stream_url);
    },
    next: function() {
        if (this.likeid >= this.likes.length) {
            this.likeid = 0;
        } else {
            this.likeid++;
        }
        soundManager.stopAll();
        soundManager.setPosition(this.curid(), 0);
        this.togglePlay();
    },
    togglePlay: function() {
        var curid = this.curid();
        var sound = soundManager.togglePause(curid);
        var self = this;
        if (_.isNull(sound) || sound === false) {
            sound = soundManager.createSound({
                id: curid,
                url: this.curstreamurl(),
                autoLoad: true,
                autoPlay: true,
                onfinish: function() { self.next(); }
            });
            this._last_playing = sound;
        }
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
        }
    },
    isPlaying: function() {
        return this._last_playing &&
            this._last_playing.playState === 1 &&
            ! this._last_playing.paused;
    },
    getWaveformData: function() {
        if (this._last_playing) {
            return this._last_playing.waveformData;
        }
    }
}


soundManager.setup({
    url: '/swf/',
    preferFlash: false,
    onready: function() {
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
        sc.likes(DMOTLES_ID, on_likes_response);
    },
    ontimeout: function() {
        alert('unable to load le sound manager');
    }
});

function demo_3js(music) {
    var container;
    var camera, renderer;

    var radius = 100, theta = 0;
    var meshes = [], play_pos = [];
    var ZERO = [0, 0, 0];

    init();
    animate();

    function init() {

        container = document.createElement( 'div' );
        document.body.appendChild( container );

        camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 10000 );

        scene = new THREE.Scene();


        //var light = new THREE.DirectionalLight( 0xffffff, 1 );
        //light.position.set( 1, 1, 1 ).normalize();
        var light = new THREE.PointLight(0xffffff);
        light.position.set( 1, 1, 1 ).normalize();
        scene.add( light );

        var geometry = new THREE.BoxGeometry( 20, 20, 20 );

        for ( var i = 0; i < 2000; i ++ ) {

            var object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: Math.random() * 0xffffff } ) );

            object.rotation.x = Math.random() * 2 * Math.PI;
            object.rotation.y = Math.random() * 2 * Math.PI;
            object.rotation.z = Math.random() * 2 * Math.PI;

            object.scale.x = Math.random() + 0.5;
            object.scale.y = Math.random() + 0.5;
            object.scale.z = Math.random() + 0.5;

            scene.add( object );
            meshes.push(object);
            var vec = [
                Math.random() * 800 - 400,
                Math.random() * 800 - 400,
                Math.random() * 800 - 400
            ];
            play_pos.push(vec)
        }

        renderer = new THREE.WebGLRenderer();
        renderer.setClearColor( 0xf0f0f0 );
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

        requestAnimationFrame( animate );

        render();

    }

    function render() {
        var music_playing = music.isPlaying();
        var scalars;


        if (music_playing) {
            theta += 0.1;
            camera.position.x = radius * Math.sin( THREE.Math.degToRad( theta ) );
            camera.position.y = radius * Math.sin( THREE.Math.degToRad( theta ) );
            camera.position.z = radius * Math.cos( THREE.Math.degToRad( theta ) );
            camera.lookAt( scene.position );
        }


        for (var i = 0; i < meshes.length; i++) {
            var mesh = meshes[i];
            var pos = music_playing ? play_pos[i] : ZERO;
            mesh.position.fromArray(pos);
        }

        renderer.render( scene, camera );
    }

}
