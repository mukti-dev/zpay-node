const https = require('https')
const fs = require('fs')


const express = require('express');

const cors = require('cors')
const app = express()
const bodyParser = require('body-parser');
const urlencodedParser = bodyParser.urlencoded({ extended: false })
app.use(bodyParser.json())
app.use(urlencodedParser)
app.use(express.static(__dirname + '/public'));
const morgan = require('morgan');
const PORT = process.env.PORT || 3002
const chalk = require('chalk')
app.use(morgan(chalk`:method :url {green :status} :response-time ms - :res[content-length]`));
const { connect } = require('./connection')
connect()
app.use(cors())

app.use('/', require('./routes/index')) // initial end point

//certificate files for ssl connection
const privateKey = fs.readFileSync('./utils/privkey.pem');
const certificate = fs.readFileSync('./utils/fullchain.pem');


// https.createServer({
//     key: privateKey,
//     cert: certificate
// }, app).listen(PORT, () => {
//     console.log(`Zpay(Production) is running at PORT: ${PORT} `)
// }); // work if the application is running at server

app.listen(PORT, () => {
    console.log(`Zpay(Testing) is running at PORT: ${PORT}`)
}) // works if application is running in localhost