# co-rethinkdb

[RethinkDB](https://github.com/rethinkdb/rethinkdb) querying language for [co](https://github.com/visionmedia/co). This library provides a wrapper for RethinkDB's [JavaScript driver](http://rethinkdb.com/api/javascript/).

[![NPM](https://badge.fury.io/js/co-rethinkdb.png)](https://npmjs.org/package/co-rethinkdb)
[![Dependency Status](https://david-dm.org/rkusa/co-rethinkdb.png?theme=shields.io)](https://david-dm.org/rkusa/co-rethinkdb)

## Examples

```js
var r = require('co-rethinkdb')
co(function*() {
  var conn = yield r.connect({ db: 'your-db' })
  var user = yield r.table('users').get(1).run(conn)
  ...
  conn.close()
})
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

## MIT License

Copyright (c) 2014 Markus Ast

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.