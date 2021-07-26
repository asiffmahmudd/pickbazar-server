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
  const categoryCollection = client.db("pickbazar").collection("categories");
  const couponCollection = client.db("pickbazar").collection("coupons");
  const orderCollection = client.db("pickbazar").collection("orders");
  const customerCollection = client.db("pickbazar").collection("customers");
  
/********************* products **********************/

  app.get("/products/:search", (req, res) =>{
    productCollection.aggregate([
      {
        '$search': {
          'index': 'default',
          'text': {
            'query': req.params.search,
            'path': {
              'wildcard': '*'
            }
          }
        }
      }
    ])
    .toArray((err, documents) =>{
        if(err){
            res.send(err.message)
        }
        else{
            res.send(documents);
        }
    })
  })

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

  app.get('/product/:id', (req,res) =>{
    productCollection.find({_id : ObjectId(req.params.id)})
    .toArray((err, documents) =>{
      if(err){
          res.send(err.message)
      }
      else{
          res.send(documents);
      }
    })
  })

  app.put('/updateProductQuantity', (req,res) => {
    let item = req.body
    try{
      productCollection.updateOne(
        {_id: ObjectId(item.id)},
        { $set: {
            quantity:Number(item.quantity)
          }
      })
      .then(result => {
        res.send(result.modifiedCount > 0)
      })
    }
    catch(e){
      res.send(e.message)
    }
  })

  app.delete('/deleteBulkProduct/', (req,res) => {
    const objects = req.body.map(item => {
      return ObjectId(item)
    })
    productCollection.deleteMany({_id: { $in: objects}})
    .then(result => {
      res.send(result.deletedCount > 0);
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
    let {name,desc,unit,price,sale,discount,quantity, category,tags,img} = req.body
    price = Number(price)
    sale = Number(sale)
    discount = Number(discount)
    quantity = Number(quantity)
    if(img?.length > 0){
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
    let {name,desc,unit,price,sale,discount,quantity, category,tags, img} = req.body
    price = Number(price)
    sale = Number(sale)
    discount = Number(discount)
    quantity = Number(quantity)

    try{
      productCollection.insertOne({name,desc,unit,price,sale,discount,quantity, category,tags,img})
      .then(result => {
        res.send(result.insertedCount > 0)
      })
    }
    catch(e){
      res.send(e.message)
    }
  })


  /********************* categories **********************/


  app.get('/categories', (req,res) => {
    categoryCollection.find({})
    .toArray((err, documents) =>{
        if(err){
            res.send(err.message)
        }
        else{
            res.send(documents);
        }
    })
  })

  app.delete('/deleteCategory/:id', (req,res) => {
    categoryCollection.deleteOne({
      _id : ObjectId(req.params.id)
    })
    .then(result => {
      res.send(result.deletedCount > 0);
    })
  })

  app.delete('/deleteBulkCategory/', (req,res) => {
    const objects = req.body.map(item => {
      return ObjectId(item)
    })
    categoryCollection.deleteMany({_id: { $in: objects}})
    .then(result => {
      res.send(result.deletedCount > 0);
    })
  })

  app.post('/addCategory', (req,res) => {
    let {name,type,img} = req.body
    try{
      categoryCollection.insertOne({name,type,img})
      .then(result => {
        res.send(result.insertedCount > 0)
      })
    }
    catch(e){
      res.send(e.message)
    }
  })

  app.put('/updateCategory/:id', (req,res) => {
    let {name,type,img} = req.body
    if(img){
      try{
        categoryCollection.updateOne(
        {_id: ObjectId(req.params.id)},
        { $set: {
            name:name,
            type:type, 
            img:img
          }
        })
        .then(result => {
          res.send(result.modifiedCount > 0)
        })
      }
      catch(e){
        res.send(e.message)
      }
    }
    else{
      try{
        categoryCollection.updateOne(
          {_id: ObjectId(req.params.id)},
          { $set: {
              name:name,
              type:type, 
            }
        })
        .then(result => {
          res.send(result.modifiedCount > 0)
        })
      }
      catch(e){
        res.send(e.message)
      }
    }
  })



  /********************* coupons **********************/


  app.get('/coupons', (req,res) => {
    couponCollection.find({})
    .toArray((err, documents) =>{
        if(err){
            res.send(err.message)
        }
        else{
            res.send(documents);
        }
    })
  })

  app.delete('/deleteCoupon/:id', (req,res) => {
    couponCollection.deleteOne({
      _id : ObjectId(req.params.id)
    })
    .then(result => {
      res.send(result.deletedCount > 0);
    })
  })

  app.delete('/deleteBulkCoupon/', (req,res) => {
    const objects = req.body.map(item => {
      return ObjectId(item)
    })
    couponCollection.deleteMany({_id: { $in: objects}})
    .then(result => {
      res.send(result.deletedCount > 0);
    })
  })


  app.post('/addCoupon', (req,res) => {
    let {name,discount,code,totalCoupons,remainingCoupons,minimumAmount,creation,status} = req.body
    discount = Number(discount)
    totalCoupons = Number(totalCoupons)
    remainingCoupons = Number(remainingCoupons)
    minimumAmount = Number(minimumAmount)
    try{
      couponCollection.insertOne({name,discount,code,totalCoupons,remainingCoupons,creation,minimumAmount,status})
      .then(result => {
        res.send(result.insertedCount > 0)
      })
    }
    catch(e){
      res.send(e.message)
    }
  })

  app.put('/updateCouponStatus/:id', (req,res) => {
    let coupon = req.body
    try{
      couponCollection.updateOne(
        {_id: ObjectId(req.params.id)},
        { $set: {
            status:coupon.status
          }
      })
      .then(result => {
        res.send(result.modifiedCount > 0)
      })
    }
    catch(e){
      res.send(e.message)
    }
  })

  app.put('/updateCoupon/:id', (req,res) => {
    let {name,discount,code,totalCoupons,remainingCoupons,minimumAmount,creation,status} = req.body
    discount = Number(discount)
    totalCoupons = Number(totalCoupons)
    remainingCoupons = Number(remainingCoupons)
    minimumAmount = Number(minimumAmount)
    try{
      couponCollection.updateOne(
        {_id: ObjectId(req.params.id)},
        { $set: {
            name:name,
            discount:discount, 
            code:code,
            totalCoupons:totalCoupons,
            remainingCoupons:remainingCoupons,
            minimumAmount:minimumAmount,
            creation:creation,
            status:status
          }
      })
      .then(result => {
        res.send(result.modifiedCount > 0)
      })
    }
    catch(e){
      res.send(e.message)
    }
  })



  /********************* orders **********************/

  app.get('/orders/:id', (req,res) => {
    orderCollection.find({customerId: req.params.id})
    .toArray((err, documents) =>{
        if(err){
            res.send(err.message)
        }
        else{
            res.send(documents);
        }
    })
  })

  app.get('/orders', (req,res) => {
    orderCollection.find({})
    .toArray((err, documents) =>{
        if(err){
            res.send(err.message)
        }
        else{
            res.send(documents);
        }
    })
  })

  app.post('/addOrder', (req,res) => {
    let {customerId,orderDate,deliveryAddress,discount,amount,paymentMethod,deliverySchedule,contactNumber,status,products} = req.body

    discount = Number(discount)
    amount = Number(amount)
    try{
      orderCollection.insertOne({customerId,orderDate,deliveryAddress,discount,amount,paymentMethod,deliverySchedule,contactNumber,status,products})
      .then(result => {
        res.send(result.insertedCount > 0)
      })
    }
    catch(e){
      res.send(e.message)
    }
  })

  app.put('/updateOrderStatus/:id', (req,res) => {
    let order = req.body
    try{
      orderCollection.updateOne(
        {_id: ObjectId(req.params.id)},
        { $set: {
            status:order.status
          }
      })
      .then(result => {
        res.send(result.modifiedCount > 0)
      })
    }
    catch(e){
      res.send(e.message)
    }
  })



  /********************* Customers **********************/


  app.post('/addCustomer', (req,res) => {
    let {uid, name, email, photo, joiningDate, orders, totalAmount} = req.body
    try{
      customerCollection.insertOne({uid, name, email, photo, joiningDate, orders, totalAmount})
      .then(result => {
        res.send(result.insertedCount > 0)
      })
    }
    catch(e){
      res.send(e.message)
    }
  })

  app.put('/updateCustomerAddress/:id', (req,res) => {
    let addresses = req.body
    try{
      customerCollection.updateOne(
        {uid: req.params.id},
        { $set: {
          deliveryAddress:addresses
        }
      })
      .then(result => {
        res.send(result.modifiedCount > 0)
      })
    }
    catch(e){
      res.send(e.message)
    }
  })

  app.put('/updateCustomerOrder/:id', (req,res) => {
    let orders = req.body.orders
    let totalAmount = req.body.totalAmount
    try{
      customerCollection.updateOne(
        {uid: req.params.id},
        { $set: {
          orders: orders,
          totalAmount: totalAmount
        }
      })
      .then(result => {
        res.send(result.modifiedCount > 0)
      })
    }
    catch(e){
      res.send(e.message)
    }
  })

  app.put('/updateCustomerContact/:id', (req,res) => {
    let contact = req.body
    try{
      customerCollection.updateOne(
        {uid: req.params.id},
        { $set: {
            contactNumber:contact
          }
      })
      .then(result => {
        res.send(result.modifiedCount > 0)
      })
    }
    catch(e){
      res.send(e.message)
    }
  })

  app.get('/customer/:id', (req,res) => {
    customerCollection.find({uid: req.params.id})
    .toArray((err, documents) =>{
        if(err){
            res.send(err.message)
        }
        else{
            res.send(documents);
        }
    })
  })

  app.get('/customers', (req,res) => {
    customerCollection.find()
    .toArray((err, documents) =>{
        if(err){
            res.send(err.message)
        }
        else{
            res.send(documents);
        }
    })
  })

  /********************* end **********************/

});

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(process.env.PORT || port)