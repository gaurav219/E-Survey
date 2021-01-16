const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');

const PORT = process.env.PORT || 9000;

// view engine setup
app.set('views', path.join(__dirname, 'public'));
app.set('view engine', 'ejs');

//setup public folder
app.use(express.static('./public'));

// setup body-parser urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

//Define routes
app.use('/', require('./routes/admin'));
app.use('/', require('./routes/visitor'));
app.use('/', require('./routes/guest'));

//home page
app.get('/', (req, res) => {
	res.render('index.ejs');
});

app.listen(PORT, () => {
	console.log('Server started at localhost ', PORT);
});
