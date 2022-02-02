const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ProductSchema = new Schema({
  name: String,
  description: String,
  price: Number,
  category: String,
  subcategory: String,
  spec: String,
  productImage: String,
  productVideo: String,
  created_at: {
    type: Date,
    default: Date.now(),
  },
});

const Product = mongoose.model("product", ProductSchema);
module.exports = Product;
