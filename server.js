const express = require('express')
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
    app.get('/', function (req, res) {
      res.send('index')
    })

    app.get('/admin', function (req, res) {
      res.sendFile(path.join(__dirname + '/public/admin.html'))
    })

    // Post to create a new card
    app.post('/create', (req, res) => {
      console.log('Received new question:');
      if (!("image" in req.body && "question" in req.body)) {
        console.log("Wrong data to insert");
        return;
      }
      console.log(req.body);
      images_coll.insertOne({ img_url: req.body.image, name: req.body.question })
        .then(res.redirect('/admin'))
        .catch(console.error('Error when inserting data: ' + req.body))
    })
  })
  .catch(err => console.error(err))


