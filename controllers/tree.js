var api = require('genius-api');

var vis = require("../public/libs/vis/vis.js");
var express = require('express');
var forms = require('forms');
var set = false;
var nodes = [];
var edges = [];
var config = require('../config.js');
var Artist = require('../models/artist.js');
var artistString;


var genius = new api(config.api_key);

function initialize(input, length){
	nodes.length = 0;
	edges.length = 0;
	var artists = [];
	var lookup_nodes = [];
	var lookup_edges = [];
	var a = 0;

	for (var i in input){
		getArtist(genius, input[i]);
	}

	function getArtist(genius, artist){
		genius.search(artist.substring(0, artist.length-1)).then(function(response) {
			var artist_search_term = artist.toLowerCase().trim();
			for (var hit of response.hits){
				console.log("search term: "+artist_search_term);
				console.log("result: "+hit.result.primary_artist.name);
				if ((hit.result.primary_artist.name.toLowerCase().search(artist_search_term) != -1) && (hit.result.primary_artist.name.length - artist_search_term.length < 2)){
					var my_artist = hit;
					break;
				}
			}

			if (!my_artist)
				return;

			var artist_id = my_artist["result"]["primary_artist"]["id"];
			var artist_name = my_artist["result"]["primary_artist"]["name"];
			var image_url = my_artist.result.primary_artist.image_url;
			var new_artist = new Artist(artist_id, artist_name);
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
			addNewArtist(new_artist, 1, true);
		});
	};	

	function addNewArtist(artist, page_num, repeat){
		genius.songsByArtist(artist.getID(), {"sort":"popularity", "per_page":"50", "page":String(page_num)}).then(function(response){
			var own_songs = [];
			a=a+1;
			for (var song of response.songs){
				if (song["primary_artist"]["id"]==artist.getID()){
					own_songs.push(song["id"]);
				}
			}

			artist.setOwnSongs(own_songs);
		
		}).then(function(){
			if (repeat){
				addNewArtist(artist, 2, false);
			}else{
				artists.push(artist);
			}
		
		});
	};

	function checkRelationship(){
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
	res.render('done_tree', {'nodes': nodes, 'edges': edges, set:true});
}	

function findArtists(req, res, next){
	artistString = req.body.artistString.split(",");
	var input_length = artistString.length;
	initialize(artistString, input_length);
	setTimeout(next, 8000)
} 

// Export a function which will create the
// router and return it

module.exports = function tree(){

  var router = express.Router();

  router.get('/', function(req, res) {
  	res.render('tree', {set:false});
  });



  router.post('/', findArtists, renderGraph);


  return router;
};
