var method = Artist.prototype;

function Artist(id, name) {
    this._id = id;
    this._name = name;
}

method.setOwnSongs = function(own_songs) {
	if(this._own_songs)
		this._own_songs = this._own_songs.concat(own_songs)
	else
		this._own_songs = own_songs;
}

method.setAppearsOn = function(appears_on) {
	this._appears_on = appears_on;
}

method.getID = function() {
	return this._id;
};

method.getName = function() {
    return this._name;
};

method.getOwnSongs = function() {
	return this._own_songs;
};

method.getAppearsOn = function() {
	return this._appears_on;
};

method.isSet = function() {
	if (this._own_songs != "undefined"){
		return true;
	}else{
		return false;
	}
}

module.exports = Artist;