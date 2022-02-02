const express = require("express");
const app = express();
const PORT = process.env.PORT_ONE || 8080;
const mongoose = require("mongoose");
const Product = require("./Product");
const jwt = require("jsonwebtoken");
// const amqp = require("amqplib");
const isAuthenticated = require("./isAuthenticated");
// multer
const path = require("path");
const multer = require("multer");
const storageImage = new multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "product-images");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const uploadImage = multer({ storage: storageImage }).single("image");
// multer

var order;

var channel, connection;

app.use(express.json());
// database connection
const url = `mongodb+srv://material_library:ML123@cluster0.jh0wv.mongodb.net/material_library?retryWrites=true&w=majority`;

const connectionParams = {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
};
mongoose
  .connect(url, connectionParams)
  .then(() => {
    console.log("Connected to database ");
  })
  .catch((err) => {
    console.error(`Error connecting to the database. \n${err}`);
  });

//database connection
app.set("view engine", "ejs");
app.get("/upload", (req, res) => {
  res.render("upload");
});
//

// API for fetching all products
app.get("/product/fetch", async (req, res) => {
  try {
    const result = await Product.find();
    res.send(result);
  } catch (err) {
    console.log(err);
  }
});
// API for buying products
app.post("/product/buy", isAuthenticated, async (req, res) => {
  const { ids } = req.body;
  const products = await Product.find({ _id: { $in: ids } });
  channel.sendToQueue(
    "ORDER",
    Buffer.from(
      JSON.stringify({
        products,
        userEmail: req.user.email,
      })
    )
  );
  channel.consume("PRODUCT", (data) => {
    order = JSON.parse(data.content);
  });
  return res.json(products);
});
// API for creating new products
app.post("/product/create", uploadImage, isAuthenticated, async (req, res) => {
  const productImage = req.file.path;
  const { name, description, price, category, subcategory, spec } = req.body;
  const newProduct = new Product({
    name,
    description,
    price,
    category,
    subcategory,
    spec,
    productImage,
  });
  newProduct.save();
  return res.json(newProduct);
});
// API for removing product
app.delete("/product/remove/:id", isAuthenticated, async (req, res) => {
  try {
    const deleteProduct = await Product.findByIdAndDelete(req.params.id);
    if (!req.params.id) {
      return res.status(400).send();
    } else {
      res.send(deleteProduct);
    }
  } catch (e) {
    res.status(500).send(e);
  }
});
// API for updating product
app.patch("product/update/:id", isAuthenticated, async (req, res) => {
  try {
    const updateProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body
    );
    if (!req.param.id) {
      return res.status(400).send();
    } else {
      res.send(updateProduct);
    }
  } catch (e) {
    res.status(500).send(e);
  }
});
app.listen(PORT, () => {
  console.log(`Product-Service at ${PORT}`);
});
