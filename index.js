require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

let mongoose;
try {
  mongoose = require("mongoose");
  mongoose.connect(process.env.MONGO_URI, {
    useUnifiedTopology: true,
    useNewUrlParser: true
  });
} catch (e) {
  console.log(e);
}

	const isValidUrl = urlString=> {
	  	var urlPattern = new RegExp('^(https?:\\/\\/)?'+ // validate protocol
	    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // validate domain name
	    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // validate OR ip (v4) address
	    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // validate port and path
	    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // validate query string
	    '(\\#[-a-z\\d_]*)?$','i'); // validate fragment locator
	  return !!urlPattern.test(urlString);
	}

const shortnerSchema = new mongoose.Schema({
  URL: String,
  short: Number
});

const Shortner = mongoose.model('Shortner', shortnerSchema)


const bodyParser = require("body-parser")

app.use(bodyParser.urlencoded({
    extended:true
}))

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.get('/api/shorturl/:shorturl?', function(req, res) {
  console.log("====== a GET request ==========")
  console.log("Reqested short is: ", req.params.shorturl)
  Shortner.findOne({short: req.params.shorturl})
    .then((foundURL) => {
      console.log("URL found by short: ", foundURL.URL)
      res.redirect(foundURL.URL)
    })
    .catch((err) => {
      //When there are errors We handle them here
      console.log(err);
    });
});

app.post('/api/shorturl', (req, res) => {

  console.log("====== A POST request =======")
  console.log("URL in request: ", req.body.url )
  console.log("Is URL valid: ", isValidUrl(req.body.url) )
  if (isValidUrl(req.body.url)){
    Shortner.findOne({URL: req.body.url})
      .then((foundURL) => {
        console.log("Does we found it in base: ", !(foundURL === null))
        let short
        if (foundURL === null) {
          short = Math.floor(Math.random() * 40 + 1)
          console.log("We found nothing, let's add")
          const shortner = new Shortner({
                URL: req.body.url, 
                short: short
          });
            shortner.save().then(()=>{
                console.log("URL ", req.body.url, " successfully saved!");
            }).catch(err => console.log(err))
        } else {
          short = foundURL.short
        }
        res.json({"original_url" : req.body.url, "short_url" : short })
      })
     .catch((err) => {
        //When there are errors We handle them here
        console.log(err);
     });
  } else {
    res.json({ error: 'invalid url'})
  }
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
