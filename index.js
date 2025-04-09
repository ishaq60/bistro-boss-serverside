const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB URI from environment
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vu8ej.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

// MongoDB Client Setup
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Connect and run server logic
async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB!");

    const userCollection = client.db("bistroDB").collection("users");
    const menuCollection = client.db("bistroDB").collection("menu");
    const reviewsCollection = client.db("bistroDB").collection("reviews");
    const cartCollection = client.db("bistroDB").collection("cart");

    // 🔐 Middleware: Verify JWT
    const verifyToken = (req, res, next) => {
      const authHeader = req.headers.authorization;
      // console.log("Authorization Header:", authHeader);

      if (!authHeader) {
        return res.status(401).send({ message: "Unauthorized - No Token" });
      }

      const token = authHeader.split(" ")[1];
      if (!token || token === "null") {
        return res
          .status(401)
          .send({ message: "Unauthorized - Invalid Token" });
      }

      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          // console.log("JWT Error:", err.message);
          return res.status(403).send({ message: "Forbidden - Token Invalid" });
        }
        req.decoded = decoded;
        next();
      });
    };

    // 🔐 Middleware: Verify Admin Role
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isAdmin = user?.role === "admin";

      if (!isAdmin) {
        return res.status(403).send({ message: "Forbidden - Admin Only" });
      }
      next();
    };

    // ✅ JWT Token Generation
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    // ✅ Register User (only if not exists)
    app.post("/user", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);

      if (existingUser) {
        return res.send({ message: "User already exists", insertedId: null });
      }

      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    // ✅ Get All Users (Admin only)
    app.get("/allusers", verifyToken, verifyAdmin, async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    // ✅ Make Admin
    app.patch("/user/admin/:id", verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = { $set: { role: "admin" } };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // ✅ Check if User is Admin
    app.get("/user/admin/:email", verifyToken, async (req, res) => {
      const email = req.params.email;

      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "Unauthorized access" });
      }

      const user = await userCollection.findOne({ email });
      const admin = user?.role === "admin";
      res.send({ admin });
    });

    // ✅ Delete User (Admin only)
    app.delete("/user/:id", verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
    });

    // ✅ Add to Cart
    app.post("/carts", async (req, res) => {
      const cartItem = req.body;
      const result = await cartCollection.insertOne(cartItem);
      res.send(result);
    });

    // ✅ Get User's Cart
    app.get("/cart", async (req, res) => {
      const email = req.query.email;
      const query = { email };
      const result = await cartCollection.find(query).toArray();
      res.send(result);
    });

    // ✅ Delete Item from Cart
    app.delete("/carts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    });

    // ✅ Get Menu Items
    app.get("/menu", async (req, res) => {
      const result = await menuCollection.find().toArray();
      res.send(result);
    });

    //
    app.get("/menu/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await menuCollection.findOne(query);
      if (!result) {
        return res.status(404).send({ error: "Item not found" });
      }
      res.send(result);
    });

    app.post("/menu", verifyToken, verifyAdmin, async (req, res) => {
      const item = req.body;
      console.log(item);
      const result = await menuCollection.insertOne(item);
      res.send(result);
    });

    app.patch("/menu/:id", async (req, res) => {
      const items = req.body;
      const id = req.params.id;
      console.log(id, items);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          name: items.name,
          category: items.category,
          price: items.price,
          description: items.description,
          image: items.image,
        },
      };
      const result = await menuCollection.updateOne(filter, updateDoc);
    });

    app.delete("/menu/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await menuCollection.deleteOne(query);
      res.send(result);
    });

    // ✅ Get Reviews
    app.get("/review", async (req, res) => {
      const result = await reviewsCollection.find().toArray();
      res.send(result);
    });

    // ✅ Dummy Data Route (optional)
    app.get("/data", async (req, res) => {
      try {
        const data = await cartCollection.find().toArray();
        res.json(data);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch data" });
      }
    });
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error);
  }
}

run();

// Root Route
app.get("/", (req, res) => {
  res.send("👨‍🍳 Bistro Boss is running!");
});

// Start Server
app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
});
