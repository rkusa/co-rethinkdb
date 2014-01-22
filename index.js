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

var next = Cursor.prototype.next
Cursor.prototype.next = function() {
  return next.bind(this)
}

var each = Cursor.prototype.each
Cursor.prototype.each = function(cb) {
  this.next = next
  return each.bind(this, cb)
}

var toArray = Cursor.prototype.toArray
Cursor.prototype.toArray = function() {
  this.each = each
  this.next = next
  return toArray.bind(this)
}

r.getConnection = function*() {
  throw new Error('No connection available')
}

module.exports = r