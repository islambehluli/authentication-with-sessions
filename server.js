const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');
var session = require('express-session');
var MongoDBStore = require('connect-mongodb-session')(session);

// Body parser
var bodyParser = require('body-parser'); 
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true })); // This may cause bugs in parsing the body. Watch out

mongoose
  .connect('mongodb://localhost/react-form', {useNewUrlParser: true})
  .then(x => {
    console.log(`Connected to Mongo! Database name: "${x.connections[0].name}"`)
  })
  .catch(err => {
    console.error('Error connecting to mongo', err)
  });

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}))

var store = new MongoDBStore({
  uri: 'mongodb://localhost:27017/sessions',
  collection: 'mySessions'
});

app.use(session({
  secret: 'This is a secret',
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
  },
  store: store,
  resave: true,
  saveUninitialized: false
}));

let userSchema = new Schema({
    username: String,
    firstname: String,
    lastname: String,
    password: String
})

const User = mongoose.model('users', userSchema)

app.post('/', (req, res) => {
    let user = req.body;
    let hash = bcrypt.hashSync(user.password, 10)
    user.password = hash
    User.create(user)
        .then((result) => {
            res.json({message: 'User created'})
            console.log(result)
        })
        .catch((err) => {
            res.json(err)
        })
    // Create without bcrypt
    // User.create(req.body)
    //     .then((result) => {
    //         res.status(200).json({message: 'User created'})
    //     })
    //     .catch((err) => {
    //         res.json(err)
    //     })
})

// Login
app.post("/login", (req, res)=> {
  User.findOne({username: req.body.username})
    .then((result)=> {
      if(!result) {
        res.status(403).json({errorMessage: "Invalid credentials"})
        return;
      }
      debugger
      if(bcrypt.compareSync(req.body.password, result.password)) {
        req.session.user = result._doc
        debugger
        const {password, ...user} = result._doc;
        res.status(200).send({user: user})
      }
      else res.status(401).json({errorMessage: "Invalid credentials"})
    })
    .catch((error)=> {
      res.status(500).json({errorMessage: error})
    })
})

app.get("/profile", (req, res)=> {
  debugger
  if(req.session.user) {
    res.json(req.session.user)
  } else {
    res.status(403).json({message: "Unauthorized"})
  }
})


const port = 5000;

app.listen(port, () => console.log(`server started on port ${port}`));