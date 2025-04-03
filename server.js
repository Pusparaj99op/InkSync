const express = require("express");
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


app.listen(8080,()=>{//server code changed to 8000
    console.log("server is running on port 8080");
});


