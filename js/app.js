function ajax_request(config) {
    var r = new XMLHttpRequest();
    r.open(
        'GET' || config.method,
        config.url,
        true, // async
    )
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
            for (kv in _.pairs(data)) {
                urlparts.concat(
                    '&',
                    encodeURIComponent(k[0]),
                    '=',
                    encodeURIComponent(k[1])
                );
            }
        }
        return urlparts.join('')
    },
    resolve: function(url, cb) {
        ajax_request({
            url: this.url('resolve.json', {url: url}),
            ondone: function(xhr) {
                if(xhr.status === 200) {
                    if (xhr.responseType === 'json') {
                    }
                    cb(xhr.response)
                }
            }
        })
    }
}


soundManager.setup({
    url: '/swf/',
    onready: function() {
        alert('Sound manager loaded!');
    },
    ontimeout: function() {
        alert('unable to load le sound manager');
    }
});
