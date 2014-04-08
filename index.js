// When installing co-rethinkdb for an application that uses the same version
// of rethinkdb, they share the same installation of rethinkdb:
// - your application
//  |- node_modules
//    |- rethinkdb
//    |- co-rethinkdb
//    |- * no node_modules/rethinkdb because it uses the parent one
//
// Therefore, the following workaround is used to not overwrite the parents
// rethinkdb behavior.
var toReset = ['rethinkdb', 'rethinkdb/ast', 'rethinkdb/net', 'rethinkdb/cursor'].map(function(name) {
  return require.resolve(name)
})

// remove parts of rethinkdb from cache
var cache = toReset.map(function(path) {
  var cache = require.cache[path]
  delete require.cache[path]
  return cache
})

var r = require('rethinkdb')
  , Cursor = require('rethinkdb/cursor').Cursor

// restore cache
toReset.forEach(function(path, i) {
  require.cache[path] = cache[i]
})

var co = require('co')

// Object, most of rethinkdb's objects inherit from
var RDBOp = r.table('mock').constructor.__super__.constructor

// the original run method
var run = RDBOp.prototype.run

// Since every rethinkdb method call, e.g., r.table('...') retuns a
// function, `co` is going to call their `.call()` method making it
// the perfect place to execute the `.run()` method instead.
RDBOp.prototype.call = function(_, done) {
  var query = this
  co(function*() {
    var conn = yield r.getConnection
    run.call(query, conn, done)
  })()
}

// Wrap the original `.run()` method.
RDBOp.prototype.run = function(conn) {
  var query = this
  return function(done) {
    run.call(query, conn, done)
  }
}

// Wrap the original `.connect()` method.
var connect = r.connect
r.connect = function(opts) {
  return connect.bind(r, opts)
}

// Wrap the original `.next()` method.
var next = Cursor.prototype.next
Cursor.prototype.next = function() {
  return next.bind(this)
}

// Wrap the original `.each()` method.
var each = Cursor.prototype.each
Cursor.prototype.each = function(cb) {
  this.next = next
  return each.bind(this, cb)
}

// Wrap the original `.toArray()` method.
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
