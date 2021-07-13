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

  app.delete('/deleteProduct/:id', (req,res) => {
    productCollection.deleteOne({
      _id : ObjectId(req.params.id)
    })
    .then(result => {
      res.send(result.deletedCount > 0);
    })
  })

  app.put('/updateProduct/:id', (req,res) => {
    let productId = req.params.id
    let {name,desc,unit,price,sale,discount,quantity, category,tags} = JSON.parse(req.body.data)
    price = Number(price)
    sale = Number(sale)
    discount = Number(discount)
    quantity = Number(quantity)

    const files = req.files
    if(files){
      const filePath = `${(__dirname)}/products/`
      let values = Object.values(files)
      let img = []
      let encImg, newImg

      values.map((file,index) => {
        file.mv(filePath+file.name, async err => {
          if(err){
            return res.status(500).send({msg:"Failed to upload image"})
          }
  
          newImg = await fs.readFileSync(filePath+file.name)
          encImg = newImg.toString('base64')
          let image = {
            contentType: file.mimetype,
            size: file.size,
            img: Buffer(encImg, 'base64')
          }
          img.push(image)
          if(values.length === (index+1)){
            try{
              productCollection.updateOne(
                {_id: ObjectId(productId)},
                { $set: {
                    name:name,
                    desc:desc,
                    unit:unit,
                    price:price,
                    sale:sale,
                    discount:discount,
                    quantity:quantity, 
                    category:category,
                    tags:tags, 
                    img:img
                  }
                }
              )
              .then(result => {
                res.send(result.modifiedCount > 0)
              })
            }
            catch(e){
              res.send(e.message)
            }
          }
        })
      })
    }
    else{
      productCollection.updateOne(
        {_id: ObjectId(productId)},
        { $set: {
            name:name,
            desc:desc,
            unit:unit,
            price:price,
            sale:sale,
            discount:discount,
            quantity:quantity, 
            category:category,
            tags:tags
          }
        }
      )
      .then(result => {
        res.send(result.modifiedCount > 0)
      })
    }
  })

  app.post('/addproduct', (req,res) => {
    const filePath = `${(__dirname)}/products/`
    const files = req.files
    let {name,desc,unit,price,sale,discount,quantity, category,tags} = JSON.parse(req.body.data)
    price = Number(price)
    sale = Number(sale)
    discount = Number(discount)
    quantity = Number(quantity)
    let values = Object.values(Object.values(files))
    let img = []
    let encImg, newImg

    values.map((file,index) => {
      file.mv(filePath+file.name, async err => {
        if(err){
          return res.status(500).send({msg:"Failed to upload image"})
        }

        newImg = await fs.readFileSync(filePath+file.name)
        encImg = newImg.toString('base64')
        let image = {
          contentType: file.mimetype,
          size: file.size,
          img: Buffer(encImg, 'base64')
        }
        img.push(image)
        if(values.length === (index+1)){
          try{
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
          catch(e){
            res.send(e.message)
          }
        }
      })
    })
  })
  
});

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(process.env.PORT || port)