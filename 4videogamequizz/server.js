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
    app.set('view engine', 'ejs')
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))


    // Endpoints
    app.get('/', function (_req, res) {
      res.send('index')
    })

    app.get('/admin', function (_req, res) {
      // Get all questions sorted by name to display them after
      const cursor = images_coll.find().sort({ name: 1 }).toArray()
        .then(questions => {
          // render using template engine EJS
          res.render('admin.ejs', { questions: questions })
        })
        .catch(console.error)
    })

    // Post to create a new card
    app.post('/questions', (req, res,) => {
      if (!("image" in req.body && "question" in req.body)) {
        // If wrong data in body
        return res.sendStatus(415);
      }

      if (req.body.image.trim() == "" || req.body.question.trim() == "") {
        // If form has empty field
        return res.redirect(422, '/admin')
      }

      // Download image if not already exists in the database/folder
      const path = `${__dirname}\\public\\images\\${req.body.image.split('/').splice(-1)[0]}`;
      const alreadyExists = download(req.body.image, path, _ => console.log('File downloaded'));

      // if not, add it into the DB
      if (!alreadyExists) {
        images_coll.insertOne({
          img_url: req.body.image,
          name: req.body.question
        })
          .then(_ => {
            return res.redirect('/admin')
          })
          .catch(console.error)
      }
      else {
        console.log("test redirect");
        return res.redirect('/admin');
      }
    })

    app.delete('/questions', (req, res) => {
      const str = 'https?://.*' + req.body.id;
      console.log(str);
      images_coll.deleteOne(
        { img_url: { $regex: str } }
      ).then(result => {
        if (result.deletedCount !== 0) {
          // delete local file
          const path = `${__dirname}\\public\\images\\${req.body.id}`;
          fs.unlinkSync(path)
          // return msg
          return res.json('card deleted')
        }
      })
        .catch(error => console.error(error))
    })
  })
  .catch(console.error)

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

