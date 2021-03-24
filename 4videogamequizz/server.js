const express = require('express')
const MongoClient = require("mongodb").MongoClient;
const path = require('path');

const app = express()
const client = new MongoClient("mongodb://localhost:27017");

GetCollection();
app.listen(3000)
app.use(express.static(__dirname + '/public'))

async function GetCollection() {
  await client.connect();
  const db = client.db('webapp')
  const images_coll = db.collection('images')
};

app.get('/', function (req, res) {
  res.send('index')
})

app.get('/admin', function (req, res) {
  res.sendFile(path.join(__dirname + '/public/admin.html'))
})
