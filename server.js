import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import listEndpoints from 'express-list-endpoints';

const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost/happyThoughts';
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.Promise = Promise;

// Defines the port the app will run on. Defaults to 8080, but can be
// overridden when starting the server. For example:
//
//   PORT=9000 npm start
const port = process.env.PORT || 8080;
const app = express();

const ThoughtSchema = new mongoose.Schema({
  thought: {
    type: String,
    minlength: 5,
    maxlength: 140,
    trim: true,
    validate: {
      validator: (value) => {
        return !/^\S{31,}$/.test(value);
      },
      message: 'Message contains words that are too long, please user shorter words.',
    },
  },
  likes: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: () => Date.now(),
  },
});

const Thought = mongoose.model('Thought', ThoughtSchema);

// Add middlewares to enable cors and json body parsing
app.use(cors());
app.use(express.json());

// Lists all of the endpoints
app.get('/', (req, res) => res.send(listEndpoints(app)));

app.get('/thoughts', async (req, res) => {
  const allThoughts = await Thought.find().sort({ createdAt: -1 }.limit(20));
  res.json(allThoughts);
});

app.post('/thoughts', async (req, res) => {
  const { name, thought } = req.body;

  try {
    const newThought = await new Thought({ name, thought }).save();
    res.status(201).json({ response: newThought, success: true });
  } catch (error) {
    res.status(400).json({ response: error, success: false });
  }
});

app.get('/thoughts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const updatedThought = await Thought.findOneAndReplace(
      { _id: id },
      { message: req.body.message },
      { new: true }
    );
    if (updatedThought) {
      res.json(updatedThought);
    } else {
      res.status(404).json({ message: 'Not found' });
    }
  } catch {
    res.status(400).json({ response: error, success: false });
  }
});

app.post('/thoughts/:id/likes', async (req, res) => {
  const { id } = req.params;

  try {
    const updatedThought = await Thought.findByIdAndUpdate(
      id,
      { $inc: { likes: 1 } },
      { new: true }
    );
    res.status(200).json({ response: updatedThought, success: true });
    if (updatedThought) {
      res.json(updatedThought);
    } else {
      res.status(404).json({ message: 'Not found' });
    }
  } catch {
    res.status(400).json({ response: error, success: false });
  }
});

// Start the server
app.listen(port, () => {
  // eslint-disable-next-line
  console.log(`Server running on http://localhost:${port}`);
});
