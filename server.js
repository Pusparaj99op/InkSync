const express = require("express");
const app = express()
const path = require("path");
const dotenv = require('dotenv');
app.use(express.static(path.join(__dirname,"views"))); 
app.use(express.static(path.join(__dirname,"public")));

dotenv.config();
const connectToDB = require('./config/db')
connectToDB();

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded


app.get('/', (req,res)=>{
    res.render("login.ejs");
});

app.post('/',(req,res)=>{
    
})


app.listen(8080,()=>{
    console.log("server is running on port 8080");
});


