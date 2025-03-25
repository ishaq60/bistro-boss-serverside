const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

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

    
    const menuCollection = client.db("bistroDB").collection('menu');
    const reviewsCollection= client.db("bistroDB").collection('reviews');
    


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
