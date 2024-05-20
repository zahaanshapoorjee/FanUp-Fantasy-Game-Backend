const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config(); // Load environment variables

const app = express();
app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
    useUnifiedTopology: true,
  },
});

// Establish the connection
client.connect()
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });

// Get the collection
const db = client.db("FantasyGame");
const FantasyGamesCollection = db.collection("FantasyGames");

// Routes

// Admin login (for now hardcoded)
app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'password') {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Fetch all games from FantasyGames collection
app.get('/games', async (req, res) => {
  try {
    const games = await FantasyGamesCollection.find().toArray();
    res.json(games);
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new game in FantasyGames collection
app.post('/games', async (req, res) => {
  try {
    const newGame = req.body;
    const result = await FantasyGamesCollection.insertOne(newGame);
    res.json(result.ops ? result.ops[0] : newGame); // Ensure compatibility with different MongoDB driver versions
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update an existing game in FantasyGames collection
app.put('/games/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedGame = req.body;
    delete updatedGame._id; // Ensure the _id field is not included in the update payload

    const result = await FantasyGamesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedGame }
    );

    if (result.modifiedCount > 0) {
      const updatedGameDoc = await FantasyGamesCollection.findOne({ _id: new ObjectId(id) });
      res.json(updatedGameDoc);
    } else {
      res.status(404).json({ error: 'Game not found or not updated' });
    }
  } catch (error) {
    console.error('Error updating game:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
