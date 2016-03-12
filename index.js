var express = require('express');
var bodyParser = require('body-parser')
var app = express();

app.set('views', './views');
app.set('view engine', 'jade');
app.use(express.static(__dirname + '/public'))


app.get('/', function(req, res) {
  res.render('home', {
    title: 'Welcome', scripts: ['/public/libs/vis/vis.js']
  });
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/tree', require('./controllers/tree')());
app.use('/tree_view', require('./controllers/tree')());



app.listen(3000);