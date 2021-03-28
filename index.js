// load the things we need
const express = require('express');
const app = express();
const session = require('express-session');
const MongoDBSession = require('connect-mongodb-session')(session);
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const User = require('./models/User');
const validations = require('./helpers/validations');
const bcrypt = require('bcryptjs');

const MongoURI = 'mongodb://localhost:27017/sessions';
const PORT = 5000 || process.env.PORT;

mongoose.connect( MongoURI ,{
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('Database connection established....') 
})    
.catch((err) => {
    console.log('Db connection failed due to '+ err)
})

const store = new MongoDBSession({
    uri: MongoURI,
    collection: 'sessions'
});

// set the view engine to ejs
app.set('view engine', 'ejs');

app.use('/assets',express.static('assets'));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
 
// parse application/json
app.use(bodyParser.json())

app.use(
    session({
        secret:'secretkey',
        resave:false,
        saveUninitialized: false, //if true => without setting (req.session.name='manish') session will be created and if false until u set any value session wont get created
        store: store
    })
);

// index page
app.get('/', (req, res) => {
    res.render('pages/index');
});

app.get('/user/login', (req, res) => {
    res.render('pages/login');
});

app.post('/user/login',async (req,res) => {
    const { email,password } = req.body;
    let user;
    let MandatoryFeilds = ['email','password'];
    let output = {
        code : 1,
        msg : 'Something went wrong'
    }
    try {
        if(validations.isset(email) && validations.isset(password)){
            user = await User.findOne({email});
            if(!user){
                throw new Error(`User does not exists with ${email}`);
            } else {
                let isMatched = await bcrypt.compare(password,user.password);
                if(isMatched){
                    req.session.isAuth = true;
                    req.session.data = user;
                    output.code = 0;
                    output.data = JSON.stringify(user);
                } else {
                    output.code = 1;
                    output.msg = "Email/Password is incorrect!";
                }
            }
        } else {
            output.code = 1;
            output.msg = "Invalid Email/Password !";
        }
    } catch(err) {
        output.code = 1;
        output.msg = err.message;
    }
    return res.status(200).json(output);
});

app.post('/user/register', async (req,res) => {
    let user;
    let output = {
        code : 1,
        msg : 'Something went wrong!'
    }
    let MandatoryFeilds = ['username','email','password'];
    try{
        let { username,email,password,country } = req.body;
        if(validations.isset(username) && validations.isset(email) && validations.isset(password)) {
            user = await User.findOne({email});
            if(!user){
                user = {
                    username : username,
                    email : email, 
                    password : password,
                    country : country
                }
                user.password = await bcrypt.hash(user.password,12);
                user = new User(user);
                user = await user.save();
                output.code = 0;
                output.msg = 'user registered successfully!';
                output.data = user;
            } else {
                throw new Error(`User already exists with ${email}`); 
            }
        } else {
            output.code = 1,
            output.msg = `These are mandatory feilds ${JSON.stringify(MandatoryFeilds)}`;
        }
    } catch(err) {
        output.code = 1;
        output.msg = err.message;
    }
    
    return res.json(output);
})

app.get('/user/dashboard',validations.isAuth, (req, res) => {
    res.render('pages/dashboard');
});

app.post('/user/logout',(req,res) => {
    req.session.destroy((err) => {
        if(err) {
            throw err;
        } else {
            res.redirect('/');
        }
    })
});

app.listen(PORT, () => {
    console.log('server started....');
});
