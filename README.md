# co-rethinkdb

[RethinkDB](https://github.com/rethinkdb/rethinkdb) querying language for [co](https://github.com/visionmedia/co). This library provides a wrapper for RethinkDB's [JavaScript driver](http://rethinkdb.com/api/javascript/).

[![NPM](http://img.shields.io/npm/v/co-rethinkdb.svg?style=flat)](https://npmjs.org/package/co-rethinkdb)
[![Dependency Status](http://img.shields.io/david/rkusa/co-rethinkdb.svg?style=flat)](https://david-dm.org/rkusa/co-rethinkdb)

With [RethinkDB 1.13](http://rethinkdb.com/blog/1.13-release/) the official JavaScript driver supports Promises. Since `co` supports Promises directly, a wrapper is not required anymore. However, `co-rethinkdb` still supports some API goodness by not having to call `.run()` all the time.

Use `co-rethinkdb` version `0.3.0` for RethinkDB prior to `1.13`.

## Examples

```js
var r = require('co-rethinkdb')
co(function*() {
  var conn = yield r.connect({ db: 'your-db' })
  var user = yield r.table('users').get(1).run(conn)
  ...
  conn.close()
})()
```

### Without `.run()`

To omit these annoying `.run()` calls completely, you can provide a `getConnection()` method.

```js
var conn

r.getConnection = function*() {
  return conn || (conn = yield r.connect({ db: db }))
}

co(function*() {
  var user = yield r.table('users').get(1)
  ...
  conn.close()
})()
```

### In non-generator context

With `co-rethinkdb` each RethinkDB query is directly a Promise. If called, it uses `r.getConnection` to retrieve a connection.

```js
var conn

r.getConnection = function*() {
  return conn || (conn = yield r.connect({ db: db }))
}

r.table('users').get(1).then(function(user) {
  ...
})
```

### Koa Middleware

```js
var domain = require('domain')
  , r = require('co-rethinkdb')

r.getConnection = function*() {
  return process.domain.conn
}

app.use(function*(next) {
  var d = domain.create()
  d.conn = yield r.connect({ db: 'tdengine' })
  d.enter()
  yield next
  d.conn.close()
})

app.use(function*(next) {
  var user = yield r.table('users').get(1)
  ...
})
```

### Load Balancer

The counterpart to `r.getConnection()` is `r.releaseConnection()`. This can be used to plug in a load balancer, e.g.:

```js
var Pool = require('jacuzzi').Pool
var r = require('co-rethinkdb')

r.getConnection = function*() {
  return yield pool.acquire.bind(pool)
}

r.releaseConnection = function*(conn) {
  pool.release(conn)
}

var pool = new Pool({
  create: function(callback) {
    r.connect({ db: 'tdengine' })
    .then(function(conn) { callback(null, conn) })
    .catch(callback)
  },
  destroy: function(conn, callback) {
    conn.close(callback)
  },
  check: function(conn) {
    return conn.open === true
  }
})
```

## MIT License

Copyright (c) 2014 Markus Ast

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.