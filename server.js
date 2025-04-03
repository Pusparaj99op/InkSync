const express = require("express");
const app = express()

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded


app.get('/', (req,res)=>{
    res.send('Hello');
})


app.listen(8080,()=>{
    console.log("server is running on port 5050");
});


