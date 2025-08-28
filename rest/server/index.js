let express = require('express');
let bodyParser = require('body-parser');
 let cors = require('cors');
let mongoose = require('mongoose');
let methodOvirride = require('method-override');
 
// criar o objeto
 
let app = express();
const port = 3000;
 
//Vincule middlewares
app.use(cors());

app.use(methodOvirride('X-HTTP-Mehod'));
app.use(methodOvirride('X-HTTP-Mehod-Override'));
app.use(methodOvirride('X-Mehod-Override'));
app.use(methodOvirride('_Mehod'));

app.use((req,res,next) => {
    res.header('Acess-Control-Allow-Origin', '*');
    res.header('Acess-Control-Allow-HEADERS', 'Origin, X-requested-With, Content-Type, Acepted');
    next()
})

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.get('/', (req, res)=>{
    res.send({status: "ok"})

})

app.listen(port, () =>{
    console.log(`Exemple app listening on port http://localhost:${port}`)
})