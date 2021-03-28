const fs = require('fs');
const path = require('path');

const express = require('express');
const request = require('request');
const MongoClient = require("mongodb").MongoClient;
const bcrypt = require('bcrypt');

// bcrypt hashing salt nb of rounds
const saltRounds = 0;

const app = express()
app.listen(3000)
app.use(express.static(__dirname + '/public'))

MongoClient.connect("mongodb://localhost:27017", { useUnifiedTopology: true })
  .then(client => {
    // Connect to mongodb
    console.log('db connected');
    const db = client.db('webapp')
    const images_coll = db.collection('images')
    const users_coll = db.collection('users')

    // Middlewares
    app.set('view engine', 'ejs')
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))


    // base page
    app.get('/', function (_req, res) {
      res.render('index.ejs')
    })

    // admin page
    app.get('/admin', function (_req, res) {
      // Get all questions sorted by name to display them after
      const cursor = images_coll.find().sort({ name: 1 }).toArray()
        .then(questions => {
          // render using template engine EJS
          res.render('admin.ejs', { questions: questions })
        })
        .catch(console.error)
    })

    // handle signin requests
    app.post('/signin', async (req, res) => {
      const uname = req.body.uname.trim();
      const pwd = req.body.pwd.trim();
      console.log(uname, pwd);
      if (uname == "" || pwd == "") {
        return res.status(422).send({ error: 'Username or Password cannot be empty' });
      }
      else {
        // Store hash in DB.
        const resultFind = await users_coll.findOne({ username: uname })
        console.log(resultFind);
        if (resultFind !== null) {
          // username already exists
          return res.status(422).send({ error: 'User already exists' })
        }
        else {
          const hash = await bcrypt.hash(pwd, saltRounds);
          const res = await users_coll.insertOne({ username: uname, password: hash })
          if (res.insertedCount === 0) {
            console.error("No user inserted");
          }
          else {
            console.log("inserted", uname);
          }
        }
      }
    })

    // handle login requests
    app.post('/login', (req, res) => {

    })

    // Post to create a new card
    app.post('/questions', (req, res,) => {
      if (!("image" in req.body && "question" in req.body)) {
        // If wrong data in body
        return res.sendStatus(400);
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
        return res.redirect('/admin');
      }
    })

    // delete a card
    app.delete('/questions', (req, res) => {
      const str = 'https?://.*' + req.body.id;
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

