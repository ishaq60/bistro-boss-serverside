const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vu8ej.mongodb.net/?retryWrites=true&w=majority`;

// Middleware
app.use(cors());
app.use(express.json());

// Create MongoDB Client
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB!");

    const userCollection = client.db("bistroDB").collection('users');
    const menuCollection = client.db("bistroDB").collection('menu');
    const reviewsCollection= client.db("bistroDB").collection('reviews');
    const cartCollection = client.db("bistroDB").collection('cart');


// all user get

app.get('/allusers',async(req,res)=>{
  const result=await userCollection.find().toArray()
  res.send(result)
})

//user related Api

app.post('/user',async(req,res)=>{
  const user=req.body
  //insert email if user doesnt exists:
  //you can do this many way(1.email unique,2.upsert 3.simple checking)
  const query={email:user.email}
  const existsingUser=await userCollection.findOne(query)
  if(existsingUser){
    return res.send({message:'user already exist',insertedId:null})
  }
  const result=await userCollection.insertOne(user)
  res.send(result)
})




    app.post('/carts',async(req,res)=>{
      const cartItem=req.body
 
      const result=await cartCollection.insertOne(cartItem)
      res.send(result)
    })
    //get cart collection
    app.get('/cart',async(req,res)=>{
      const email=req.query.email
      const query={email:email}
      const result=await cartCollection.find(query).toArray()
      res.send(result)

    })
    
//Menu collection Get
app.get('/menu',async(req,res)=>{
    const result=await menuCollection.find().toArray()
    res.send(result)
})

// review collection  get

app.get('/review',async(req,res)=>{
    const result=await reviewsCollection.find().toArray()
    res.send(result)
})

//item dele by dashboard in

app.delete('/carts/:id',async(req,res)=>{
  const id=req.params.id
  const query={_id:new ObjectId(id)}
  const result=await cartCollection.deleteOne(query)
  res.send(result)
})


    // Example route to fetch data
    app.get('/data', async (req, res) => {
      try {
        const data = await collection.find().toArray();
        res.json(data);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch data" });
      }
    });

  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

//cart collection


// Run MongoDB connection setup
run();

// Base Route
app.get('/', (req, res) => {
  res.send('Boss is sitting');
});



// Start Server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

//**
// ....................Nameing convention

//  */