const fs = require('fs');
const path = require('path');

const request = require('request');
const express = require('express');
const session = require('express-session');
const MongoClient = require("mongodb").MongoClient;
const bcrypt = require('bcrypt');
const Fuse = require('fuse.js')

// bcrypt hashing salt nb of rounds
// exponential time growth:
// 8 = around 40 hashs per second
// 13 = around 1 hash per second
const saltRounds = 8;

const app = express()
app.listen(5000)
app.use(express.static(__dirname + '/public'))

MongoClient.connect("mongodb://localhost:27017", { useUnifiedTopology: true })
  .then(client => {
    // Connect to mongodb
    console.log('db connected');
    const db = client.db('webapp')
    const images_coll = db.collection('images')
    const users_coll = db.collection('users')
    const scores_coll = db.collection('scores')
    let current_questions = null;
    let last_index = -1;

    // Middlewares
    app.set('view engine', 'ejs')
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))
    app.use(session({
      secret: Math.random().toString(36).substring(10),
      resave: true,
      saveUninitialized: true
    }))


    // base page
    app.get('/', function (req, res) {
      res.render('index.ejs')
    })

    // logout page
    app.get('/logout', function (req, res) {
      req.session.destroy(_ => {
        res.render('index.ejs')
      });
    })

    // playing page
    app.get('/play', (req, res) => {
      if (req.session.loggedin) {
        // Get 10 random questions
        images_coll.aggregate(
          [{ $sample: { size: 10 } }]
        ).toArray()
          .then(questions => {
            current_questions = questions;
            last_index = 0;
            // render using template engine EJS
            res.render('play.ejs', {
              image: current_questions[0].img_url,
              index: 0,
              score: 0,
              username: req.session.username,
              rightAnswer: false,
              gameFinished: false
            })
            res.end()
          })
          .catch(console.error)
      }
      else {
        res.send("You need to login to view this page. <a href='/'>Back to main page</a>")
        res.end()
      }
    })

    app.post('/play', async (req, res) => {
      if (req.session.loggedin) {
        const answer = req.body.answer;
        const index = parseInt(req.body.index);
        const score = parseInt(req.body.score);
        const possibleAnswers = current_questions.map(x => {
          return x.name;
        })

        if (last_index > index) {
          return res.send("You cannot go back to previous questions, or resubmit your score. <a href='/play'>Back to start</a>")
        }

        // fuzzy matching
        const fuse = new Fuse(current_questions.map(x => { return x.name }), {
          includeScore: true,
          threshold: .2,
          ignoreLocation: true
        });
        const result = fuse.search(answer);
        console.log(result);

        const rightAnswer = result.length > 0 ?
          (result[0].item === current_questions[index].name) :
          false

        // End screen
        if (index === 9) {
          last_index += 1;
          const finalScore = score + rightAnswer;
          await scores_coll.insertOne({ name: req.session.username, score: finalScore, date: new Date(Date.now()) })
          const highScoresList = await scores_coll.find().sort({ score: -1, date: 1 }).limit(10).toArray()
          return res.render('play.ejs', {
            index: 10,
            // final score whether last answer is true/false
            score: finalScore,
            topScores: highScoresList,
            username: req.session.username,
            gameFinished: true
          })
        }
        if (rightAnswer) {
          last_index += 1;
          return res.render('play.ejs', {
            image: current_questions[index + 1].img_url,
            rightAnswer,
            index: index + 1,
            score: score + 1,
            username: req.session.username,
            gameFinished: false
          })
        }
        // wrong answer
        else {
          last_index += 1;
          return res.render('play.ejs', {
            image: current_questions[index + 1].img_url,
            rightAnswer,
            index: index + 1,
            score: score,
            username: req.session.username,
            gameFinished: false
          })
        }
      }
      else {
        res.send("You need to login to view this page. <a href='/'>Back to main page</a>")
        res.end()
      }
    })

    // admin page
    app.get('/admin', function (req, res) {
      if (req.session.role == "admin")
        // Get all questions sorted by name to display them after
        images_coll.find().sort({ name: 1 }).toArray()
          .then(questions => {
            // render using template engine EJS
            res.render('admin.ejs', { questions });
            res.end()
          })
          .catch(console.error)
      else {
        res.send("User is not admin. <a href='/'>Back to main page</a>")
        res.end()
      }

    })

    // handle signin requests
    app.post('/signin', async (req, res) => {
      const uname = req.body.uname.trim();
      const pwd = req.body.pwd.trim();
      if (uname == "" || pwd == "") {
        res.status(422).send({ error: 'Username or Password cannot be empty' });
      }
      else {
        // Store hash in DB.
        const resultFind = await users_coll.findOne({ username: uname })
        console.log(resultFind);
        if (resultFind !== null) {
          // username already exists
          res.status(422).send({ error: 'User already exists' })
        }
        else {
          const hash = await bcrypt.hash(pwd, saltRounds);
          const insertRes = await users_coll.insertOne({ username: uname, password: hash })
          if (insertRes.insertedCount === 0) {
            console.error("No user inserted");
          }
          else {
            req.session.loggedin = true;
            req.session.username = uname;
            req.session.role = "user";
            res.redirect('/play')
          }
        }
        res.end()
      }
    })

    // handle login requests
    app.post('/login', async (req, res) => {
      const uname = req.body.luname.trim();
      const pwd = req.body.lpwd.trim();
      if (!uname || !pwd) {
        res.status(422).send({ error: 'Username or Password cannot be empty' });
        res.end()
      }
      else {
        // get password hash in DB
        const user = await users_coll.findOne({ username: uname })
        if (user === null) {
          // username already exists
          res.status(422).send({ error: 'No account for this username' })
          res.end()
        }
        else {
          // Check if username and password correspond
          const isValidPassword = await bcrypt.compare(pwd, user.password)
          if (!isValidPassword) {
            console.log("invalid");
            res.status(401).send({ error: 'Wrong password for this username' })
          }
          else {
            req.session.loggedin = true;
            req.session.username = uname;
            if (user.role == "admin") {
              req.session.role = "admin";
              res.redirect('/admin');
              res.end()
            }
            else {
              req.session.role = "user";
              res.redirect('/play');
              res.end()
            }
          }
        }
        res.end()
      }
    })

    // Post to create a new card
    app.post('/questions', (req, res,) => {
      if (req.session.role == "admin") {
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
        res.end();
      }
      else {
        res.sendStatus(401);
      }
    })

    // delete a card
    app.delete('/questions', (req, res) => {
      if (req.session.role == "admin") {
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
      }
      else {
        res.sendStatus(401);
      }
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

