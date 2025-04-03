const express = require("express");
<<<<<<< HEAD
const app = express();
const path = require("path");
// const ejsMate = require("ejs-mate");
app.use(express.static(path.join(__dirname,"views"))); 
app.use(express.static(path.join(__dirname,"assets")));

// app.set("views engine","ejs");
// app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

app.get("/",(req,res)=>{
    res.render("login.ejs");
});
=======
const app = express()
const dotenv = require('dotenv');
dotenv.config();
const connectToDB = require('./config/db')
connectToDB();

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
>>>>>>> cc6abd43547515bc51a3e29d395c9fcd5a51bfac


app.get('/', (req,res)=>{
    res.send('Hello');
})


app.listen(8080,()=>{
    console.log("server is running on port 8080");
});


