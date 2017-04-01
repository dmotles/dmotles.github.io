# dmotles.github.io

A fun interactive javascript experiment.

* Click to pause and play. 
* Left and right arrow keys change songs.

I apologize if you don’t like the music. I really like happy fun dance music.


## DEV

Requirements are:
* npm/node installed. I’m using NPM 4.2.0 and node v7.8.0
* gulp CLI. You can install with `npm install gulp-cli -g`.

```bash
npm install
gulp
gulp server
```

Then, open your webbrowser to `http://127.0.0.1:8000`.

You can also run `gulp watch` in a spare terminal window to auto re-concat and re-compile
any code changes made in `src/js/*`.


**NOTE** contents in `js/` are auto-generated from gulp tasks. They are committed to the repo because they have to be to be served by github.io. All 3rd party code is preserved with licenses and attribution intact.
