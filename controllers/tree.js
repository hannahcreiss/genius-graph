var api = require('genius-api');
var InputModule = require('../index.js')
var vis = require("../public/js/vis/vis.js");
var express = require('express');
var forms = require('forms');
var set = false;
var nodes = [];
var edges = [];
var Artist = require('../models/artist.js');

var genius = new api(process.env.API_KEY);

function initialize(input){
	console.log("initializing")
	var artistIDs = InputModule.artistIDs
	nodes.length = 0;
	edges.length = 0;
	var artists = [];
	var lookup_nodes = [];
	var lookup_edges = [];
	var a = 0;
	console.log(input);

	for (var i in input){
		console.log(input[i]);
		var lookup_id = artistIDs[input[i]];
		console.log(lookup_id);
		getArtist(lookup_id, input[i])
	}


	//todo: make the performance a lot better
	//figure out why you sometimes get error responses from the genius api
	function getArtist(artist_id, artist_name){
			var image_url;
			var new_artist = new Artist(artist_id, artist_name);
			
			genius.artist(artist_id).then(function(response) {
  				image_url = response.artist.image_url;
			}).then(function(){

				var artist_node = 
				{
					id: parseInt(artist_id, 10), 
					shape: 'circularImage', 
					color: {
						border: "#CCCCCC"
					},
				    image: image_url, 
					brokenImage: "http://a4.mzstatic.com/us/r30/Purple49/v4/be/7b/f9/be7bf9d9-6993-67cb-5756-f291501d5837/icon175x175.jpeg", 
					label: artist_name
				};
				nodes.push(artist_node)
			});

			addNewArtist(new_artist, artist_id, 1, false);
			addNewArtist(new_artist, artist_id, 2, false);
			addNewArtist(new_artist, artist_id, 3, false);
			addNewArtist(new_artist, artist_id, 4, false);
			addNewArtist(new_artist, artist_id, 5, false);
			addNewArtist(new_artist, artist_id, 6, true);
		

	};	

	function addNewArtist(artist, id, page_num, done){

		genius.songsByArtist(id, {"sort":"popularity", "per_page":"50", "page":String(page_num)}).then(function(response){
			var own_songs = [];
			a=a+1;
			for (var song of response.songs){
				if (song.primary_artist.id==id){
					own_songs.push(song.id);
				}
			}
			var name = artist.getName();
			console.log(name + ": " + own_songs.length +" songs")
			artist.setOwnSongs(own_songs);
		
		}).then(function(){
			if (done){
				artists.push(artist);
				console.log("added new artist")
			}
		
		});
	};

	function checkRelationship(){
		console.log("checking relationship")
		for (var this_artist of artists){
			for (var song of this_artist.getOwnSongs()){
				checkSongInfo(song);
			}
		}
	}

	function checkSongInfo(song){
		genius.song(song).then(function(response) {
			song_artist = response.song.primary_artist;
			song_name = response.song.title;
			for (var featured_artist of response.song.featured_artists){
				for(var our_artist of artists){
					//if the featured artist is found in the artists we already have
					if (featured_artist["id"] == our_artist.getID()){
						
						var node = 
						{
							id: parseInt(response.song.id, 10), 
							color: {
								background: "#FFFC64",
								border: "#CCCCCC"
							},
							label: song_name
						};

						var edge_id = song_artist.name + String(node.id);
						//if there is not already a node for this song
						if (lookup_nodes.indexOf(node.id) == -1){
							nodes.push(node);
							lookup_nodes.push(node.id);
							if(lookup_edges.indexOf(edge_id) == -1){
								edges.push({from: parseInt(song_artist.id, 10), to: node.id});
								lookup_edges.push(edge_id);
							}
						}
						edge_id = featured_artist.name + String(node.id);
						if(lookup_edges.indexOf(edge_id) == -1){
							edges.push({from: parseInt(featured_artist.id, 10), to: node.id});
							lookup_edges.push(edge_id)
						}
						
					}
				}	
			}

		});
	}

	setTimeout(checkRelationship, 5000)
}


var artistsForm = forms.create({
  artistString: forms.fields.string({
    required: true
  })
});

function renderGraph(req,res,next){
	console.log("render graph function");
	console.log("number of nodes", nodes.length)
	res.render('done_tree', {'nodes': nodes, 'edges': edges, set:true});
}	

function findArtists(req, res, next){
	var artistString = req.body.artistString.split(",");
	initialize(artistString);
	setTimeout(next, 10000)
} 

// Export a function which will create the
// router and return it

module.exports = function tree(){

  var router = express.Router();

  router.post('/', findArtists, renderGraph);


  return router;
};
