const express = require('express');
const request = require('request');
const fs = require('fs');
const MongoClient = require("mongodb").MongoClient;
const path = require('path');

const app = express()

app.listen(3000)
app.use(express.static(__dirname + '/public'))

MongoClient.connect("mongodb://localhost:27017", { useUnifiedTopology: true })
  .then(client => {
    // Connect to mongodb
    console.log('db connected');
    const db = client.db('webapp')
    const images_coll = db.collection('images')

    // Middlewares
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))


    // Endpoints
    app.get('/', function (_req, res) {
      res.send('index')
    })

    app.get('/admin', function (_req, res) {
      const cursor = images_coll.find()
      res.sendFile(path.join(__dirname + '/public/admin.html'))
    })

    // Post to create a new card
    app.post('/create', (req, res) => {
      if (!("image" in req.body && "question" in req.body)) {
        console.log("Wrong data to insert");
        return;
      }

      // Download image if not already here
      const path = `${__dirname}\\public\\images\\${req.body.image.split('/').splice(-1)[0]}`;
      const alreadyExists = download(req.body.image, path, _ => console.log('File downloaded'));

      images_coll.insertOne({ img_url: req.body.image, name: req.body.question })
        .then(_ => {
          console.log('Inserted new question:');
          console.log(req.body);
          res.redirect('/admin')
        })
        .catch(err => console.error(err))
    })
  })
  .catch(err => console.error(err))

// utility function to download a file if not exists
// Returns whether file existed or not
const download = (uri, filename, callback) => {
  if (!fs.existsSync(filename)) {
    request.head(uri, (_err, res, _body) => {
      console.log('content-type:', res.headers['content-type']);
      console.log('content-length:', res.headers['content-length']);

      request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
    return false;
  }
  return true;
};

