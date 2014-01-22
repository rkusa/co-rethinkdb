var r = require('rethinkdb')
  , co = require('co')

var RDBOp = r.table('mock').constructor.__super__.constructor

var run = RDBOp.prototype.run

RDBOp.prototype.call = function(_, done) {
  var query = this
  co(function*() {
    var conn = yield r.getConnection
    run.call(query, conn, done)
  })()
}

RDBOp.prototype.run = function(conn) {
  var query = this
  return function(done) {
    run.call(query, conn, done)
  }
}

var connect = r.connect
r.connect = function(opts) {
  return connect.bind(r, opts)
}

var Cursor = require('rethinkdb/cursor').Cursor
  , toArray = Cursor.prototype.toArray
Cursor.prototype.toArray = function() {
  return toArray.bind(this)
}

r.getConnection = function*() {
  throw new Error('No connection available')
}

module.exports = r

// co(function*() {
//   // r.getConnection = function(callback) {
//   //   co(function*() {
//   //     callback(yield r.connect({ db: 'tdengine' }))
//   //   })()
//   // }
//   r.getConnection = function*() {
//     return yield r.connect({ db: 'tdengine' })
//   }
//   // console.log(yield r.table('buildings').orderBy('pos'))
//   // console.log(asd.call)
//   var cursor = yield r.table('buildings')
//   var buildings = yield cursor.toArray()
//   console.log(buildings)

//   // conn.close()
// })()