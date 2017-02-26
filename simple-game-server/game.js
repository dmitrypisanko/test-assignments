'use strict'

const Game = require('./classes/game'),
        koa = require( 'koa' ),
        socket = require( 'koa-socket'),
        serve = require('koa-static-folder'),
        io = new socket(),
        app = new koa()

//обработаем папку со статикой
app.use(serve('./views'))

io.attach( app )

//запустим сервер
app.listen( 5555 )

//Lets start!
let game = new Game(io)
game.start()