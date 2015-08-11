var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var LastfmAPI = require('lastfmapi');
var echojs = require('echojs');
var Q = require('q');
var _ = require('lodash');

// server our public shitz
app.use(express.static('public'));

var lfm = new LastfmAPI({
  'api_key': process.env.LFM_KEY,
  'secret': process.env.LFM_SECRET
});

var echo = echojs({
  key: process.env.ECHONEST_KEY
});

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;        // set our port

var router = express.Router();

router.get('/:user/:period?', function (req, res) {
  var period = req.params.period || 'overall';
  lfm.user.getTopArtists({'user': req.params.user, 'period': period, 'limit': 50}, function (err, artists) {
    var promises = [];
    if (err) {
      return console.log('Falied: ' + err);
    }
    artists['artist'].forEach(function (artist) {
      var name = artist.name;
      console.log("Querying: " + name);
      var d = Q.defer();
      promises.push(d.promise);
      echo('artist/profile').get({'name': name, 'bucket': 'artist_location'},
        function (err, json) {
          var timer = setTimeout(d.resolve, 2000);
          if (err || !json.response.artist || !json.response.artist.artist_location || !json.response.artist.artist_location.country) {
            console.log('Echo failed for artist: ' + name);
            clearTimeout(timer);
            d.resolve();
          }
          else {
            console.log(name + ' -> ' + json.response['artist']['artist_location']['country']);
            clearTimeout(timer);
            d.resolve({artist: name, country: json.response['artist']['artist_location']['country']});
          }
        }
      )
    });
    Q.all(promises).then(function (artists) {
      var response = {metadata: {}};
      artists = _.compact(artists);
      response['artists'] = artists;
      response['metadata']['countrypercent'] = _.map(_.countBy(artists, "country"), function (value, key) {
        return {country: key, plays: value, percent: value / artists.length}
      });
      return res.json(response)
    });
  });
});

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use('/api', router);

app.listen(port);
console.log('Magic happens on port ' + port);
