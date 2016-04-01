var express = require('express');
var bodyParser = require('body-parser')
var mongodb = require('mongodb');
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var app = express();
var artistNames = [];
var artistIDs = {};
var config = require('./config.js');
var uri = config.db_uri

var queryArtists = function(db, callback) {
   var cursor =db.collection('artists').find( );
   cursor.each(function(err, doc) {
      assert.equal(err, null);
      if (doc != null) {
        artistNames.push(doc.name);
        artistIDs[doc.name] = doc.genius_id;
      } else {
         callback();
      }
   });
   exports.artistIDs = artistIDs;
};

app.set('views', './views');
app.set('view engine', 'jade');
app.use(express.static(__dirname + '/public'))


app.get('/', function(req, res) {
    console.log("HIIIIII")
	mongodb.MongoClient.connect(uri, function(err, db) {

		assert.equal(null, err);
		queryArtists(db, function() {
		 console.log("got all the data") 
		 res.render('tree', {
    		title: 'Welcome', scripts: ['/public/js/vis/vis.js'], 'artistNames':artistNames
  		});	
		db.close();
	});
});	
});


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/', require('./controllers/tree')());

app.listen(process.env.PORT || 3000, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});