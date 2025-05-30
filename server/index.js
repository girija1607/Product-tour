require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Tour = require("./models/Tour");


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

// User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
});


const User = mongoose.model('User', userSchema);



// Signup API
app.post('/api/signup', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Login API
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// After the User model and routes...


// Create Tour
app.post("/api/tours", async (req, res) => {
  const { title, description, published } = req.body;

  try {
    const tour = new Tour({ title, description, published });
    await tour.save();
    res.status(201).json({ message: "Tour created successfully", tour });
  } catch (error) {
    res.status(500).json({ message: "Failed to create tour" });
  }
});

// Get All Tours
app.get("/api/tours", async (req, res) => {
  try {
    const tours = await Tour.find();
    res.json(tours);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch tours" });
  }
});
app.get("/api/tours/:id", async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    if (!tour) return res.status(404).json({ message: "Tour not found" });
     if (tour.published) {
      tour.views += 1;
      await tour.save();
    }
    res.json(tour);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch tour" });
  }
});

app.put("/api/tours/:id", async (req, res) => {
  try {
    const { title, description, published, steps } = req.body; // include steps

    const tour = await Tour.findByIdAndUpdate(
      req.params.id,
      { title, description, published, steps }, // include steps
      { new: true }
    );

    res.json({ message: "Tour updated", tour });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ message: "Failed to update tour" });
  }
});

// Delete a Tour
app.delete("/api/tours/:id", async (req, res) => {
  try {
    await Tour.findByIdAndDelete(req.params.id);
    res.json({ message: "Tour deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete tour" });
  }
});

// Add Step to Tour
app.post("/api/tours/:tourId/steps", async (req, res) => {
  const { tourId } = req.params;
  const { title, content, selector, order } = req.body;

  try {
    const tour = await Tour.findById(tourId);
    if (!tour) return res.status(404).json({ message: "Tour not found" });

    tour.steps.push({ title, content, selector, order });
    await tour.save();

    res.status(201).json({ message: "Step added", tour });
  } catch (err) {
    res.status(500).json({ message: "Failed to add step" });
  }
});

// Get Steps for a Tour
app.get("/api/tours/:tourId/steps", async (req, res) => {
  const { tourId } = req.params;

  try {
    const tour = await Tour.findById(tourId);
    if (!tour) return res.status(404).json({ message: "Tour not found" });

    res.json(tour.steps);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch steps" });
  }
});



// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

