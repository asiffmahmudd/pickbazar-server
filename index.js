const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config()
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const fs = require('fs-extra')
const fileUpload = require('express-fileupload')

const app = express();
const port = 4000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('products'))
app.use(fileUpload())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.a3ov0.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const productCollection = client.db("pickbazar").collection("products");
  // perform actions on the collection object

  app.get("/products", (req, res) =>{
    productCollection.find({})
    .toArray((err, documents) =>{
        if(err){
            res.send(err.message)
        }
        else{
            res.send(documents);
        }
    })
  })

  app.post('/addproduct', (req,res) => {
    const filePath = `${(__dirname)}/products/`
    const files = req.files
    let {name,desc,unit,price,sale,discount,quantity, category,tags} = JSON.parse(req.body.data)
    price = Number(price)
    sale = Number(sale)
    discount = Number(discount)
    quantity = Number(quantity)
    const values = Object.values(Object.values(files))
    
    let source = ""
    let img = []

    values.map((file,index) => {
      source = (filePath+file.name).toString()
      file.mv(source, err => {
        if(err){
          return res.status(500).send({msg:"Failed to upload image"})
        }

        const newImg = fs.readFileSync(source)
        const encImg = newImg.toString('base64')
        
        let image = {
          contentType: file.mimetype,
          size: file.size,
          img: Buffer(encImg, 'base64')
        }
        img.push(image)
        if(values.length === (index+1)){
          productCollection.insertOne({name,desc,unit,price,sale,discount,quantity, category,tags,img})
          .then(result => {
            values.map(item => {
              fs.remove(filePath+item.name, error => {
                if(error){
                  res.send(error.message)
                }
              })
            })
            res.send(result.insertedCount > 0)
          })
        }
      })
    })
  })
  
});

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(process.env.PORT || port)