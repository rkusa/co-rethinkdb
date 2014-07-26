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
var IterableResult = require('rethinkdb/cursor').Cursor.__super__.constructor

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
    var res  = yield run.call(query, conn)
    yield r.releaseConnection(conn)
    done(null, res)
  })()
}

// Wrap the original `.each()` method.
var each = IterableResult.prototype._each
IterableResult.prototype._each = function(cb, finished) {
  if (finished) return each.call(this, cb, finished)
  else return each.bind(this, cb)
}

r.getConnection = function*() {
  throw new Error('No connection available')
}

r.releaseConnection = function*() {
}

module.exports = r