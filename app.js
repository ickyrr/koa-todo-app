var logger = require('koa-logger');
var livereload = require('koa-livereload');
var serve = require('koa-static');
var route = require('koa-route');
var views = require('co-views');
var parse = require('co-body');
var koa = require('koa');
var app = koa();

// "data store"
var todos = [];

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

// Specifying Swig view engine
var render = views(__dirname + '/views', { map: { jade: 'jade' }, default: 'jade'});

// List function
function *list() {
  this.body = yield render('index', { todos: todos });
}

// create new todo item.
function *add() {
  this.body = yield render('new');
}

// edit a todo items.
function *edit(id) {
    var todo = todos[id];
    if (!todo) this.throw(404, 'invalid todo id');
    this.body = yield render('edit', { todo: todo });
}

// show todo item.
function *show(id) {
  var todo = todos[id];
  if (!todo) this.throw(404, 'invalid todo id');
  this.body = yield render('show', { todo: todo });
}

//delete a todo item
function *remove(id) {
  var todo = todos[id];
  if (!todo) this.throw(404, 'invalid todo id');
 todos.splice(id, 1);
  //Changing the Id for working with index
  for (var i = 0; i < todos.length; i++)
  {
      todos[i].id = i;
  }
  this.redirect('/');
}

// create a todo item.
function *create() {
  var todo = yield parse(this);
  var id = todos.push(todo);
  todo.created_on = new Date;
  todo.updated_on = new Date;
  todo.id = id-1;
  this.redirect('/');
}

// update a todo item.
function *update() {
  var todo = yield parse(this);
  var index = todo.id;
  todos[index].name = todo.name;
  todos[index].description = todo.description;
  todos[index].updated_on = new Date;
  this.redirect('/');
}

// static file serve
app.use(
  serve(__dirname + '/public'),
  {
     maxage: 0,
     hidden: false,
     index: 'index.html',
     defer: true
  }
);

app.listen(3000);
