const server = require('express')()
const Twitter = require('twitter')
const socketIO = require('socket.io')

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
io.on('connection', client => {

  client.on('disconnect', () => {
  })
})

const stream = client.stream('statuses/filter', { track: '#tradewar' })
stream.on('data', function (event) {
  if (event) {
    io.sockets.emit('new-message', event)
  }
})
