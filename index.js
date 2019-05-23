const server = require('express')()
const Twitter = require('twitter')
const socketIO = require('socket.io')
const firebase = require('./firebase')
const moment = require('moment')

const client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
})

const port = '4000'

const app = server.listen(port, () => {
  console.log('Server is listening at ' + port)
})

const io = socketIO.listen(app)

const stream = client.stream('statuses/filter', { track: '#tradewar' })
let events = []
let newEvents = []
firebase.database().ref('events').once('value', snapshots => {
  if (snapshots.val())
    events = [...(Object.values(snapshots.val()) || []), ...events]
})

io.on('connection', client => {
  io.sockets.emit('new-message', events)
  firebase.database().ref('data').once('value', snapshots => {
    let data = []
    if (snapshots.val())
      data = Object.values(snapshots.val())
    io.sockets.emit('new-data', data)
  })
  client.on('disconnect', () => {
  })
})

stream.on('data', function (event) {
  if (event) {
    events.push({ text: event.text, createdAt: event.created_at })
    io.sockets.emit('new-message', events)
    newEvents.push({ text: event.text, createdAt: event.created_at })
    firebase.database().ref('events').set(events)
  }
})

setInterval(() => {
  firebase.database().ref('data').once('value', snapshots => {
    let data = []
    if (snapshots.val())
      data = Object.values(snapshots.val())
    data.push({ time: moment().format('HH:mm:ss DD-MM-YYYY'), count: newEvents.length })
    io.sockets.emit('new-data', data)
    firebase.database().ref('data').set(data)
    newEvents = []
  })
}, 60000)
