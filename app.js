var logger = require('koa-logger');
var livereload = require('koa-livereload');
var serve = require('koa-static');
var route = require('koa-route');
var views = require('co-views');
var parse = require('co-body');

// Mongo
var monk = require('monk');
var wrap = require('co-monk');
var db = monk('localhost/todoapp');
var collection = db.get('todos');

var koa = require('koa');
var app = koa();

var todos = wrap(collection);

// wrap subsequent middleware in a logger
app.use(logger());

// livereload
app.use(livereload(
  { port: 35729 }
));

app.use(function *(next){
  var start = new Date;
  yield next;
  var ms = new Date - start;
  console.log('%s %s - %s', this.method, this.url, ms);
});

// route middleware
app.use(route.get('/', list));
app.use(route.get('/todo/new', add));
app.use(route.get('/todo/:id', show));
app.use(route.get('/todo/delete/:id', remove));
app.use(route.get('/todo/edit/:id', edit));
app.use(route.post('/todo/create', create));
app.use(route.post('/todo/update', update));

// render view with jade
var render = views(__dirname + '/views', { map: { jade: 'jade' }, default: 'jade'});

// todo list
function *list() {
  var res = yield todos.find({});
  this.body = yield render('index', { todos: res });
}

// create new todo
function *add() {
  this.body = yield render('new');
}

// edit todo
function *edit(id) {
    var res = yield todos.findOne({id: parseInt(id, 10)});
    if (!res) this.throw(404, 'invalid todo id');
    this.body = yield render('edit', { todo: res });
}

// show todo
function *show(id) {
  var res = yield todos.findOne({id: parseInt(id, 10)});
  if (!res) this.throw(404, 'invalid todo id');
  this.body = yield render('show', { todo: res });
}

// delete todo
function *remove(id) {
  var res = yield todos.findOne({id: parseInt(id, 10)});
  if (!res) this.throw(404, 'invalid todo id');
  todos.remove(res);
  this.redirect('/');
}

// create todo
function *create() {
  var todo = yield parse(this);
  todo.id = (!todos.length)? 1: todos.length + 1;
  todo.created_on = todo.updated_on = new Date;
  todos.insert(todo);
  this.redirect('/');
}

// update todo
function *update() {
  var todo = yield parse(this);
  todo.updated_on = new Date;
  id = parseInt(todo.id, 10);
  todos.updateById(id, todo);
  this.redirect('/');
}

// static file serve
app.use(serve(__dirname + '/public'), { defer: true });

app.listen(3000);
