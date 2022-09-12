const http = require("http");
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.urlencoded({extended : false}));

app.use('/add-product',(req, res, next)=> {
    res.send('<form action="/product" method="POST"><input type="text" name="title"><button>Add Product</button></form>');
});

app.use('/product', (req, res) => {
    console.log(req.body);
    res.redirect('/');
})

app.use('/',(req, res, next)=> {
    res.send('<h1>Hello World</h1>');
});


app.listen(3001);
