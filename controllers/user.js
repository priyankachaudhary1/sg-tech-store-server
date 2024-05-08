// Import required models
const User = require("../models/user");
const Product = require("../models/product");
const Cart = require("../models/cart");

// Define the userCart function
exports.userCart = async (req, res) => {
  // Extract the cart from the request body
  const { cart } = req.body;

  // Find the user in the database using the email from the request user
  const user = await User.findOne({ email: req.user.email }).exec();
  console.log("user._id", user._id);

  // Check if a cart already exists for the logged in user
  let cartExistByThisUser = await Cart.findOne({ orderdBy: user._id }).exec();
  console.log("cartExistByThisUser", cartExistByThisUser);

  // If a cart exists, remove it
  if (cartExistByThisUser) {
      await Cart.deleteOne({ _id: cartExistByThisUser._id });
  }

  // Map over the cart items, find each product in the database, and return an array of product details
  let products = await Promise.all(cart.map(async (item) => {
    let { price } = await Product.findById(item._id).select("price").exec();
    return {
      product: item._id,
      count: item.count,
      color: item.color,
      price
    };
  }));

  // Calculate the total cost of the cart by reducing over the products array
  let cartTotal = products.reduce((total, item) => total + item.price * item.count, 0);

  // Create a new cart with the products, total cost, and user id, then save it to the database
  let newCart = await new Cart({
    products,
    cartTotal,
    orderdBy: user._id,
  }).save();

  // Send a response indicating success
  res.json({ ok: true });
};


exports.getUserCart = async (req, res) => {
  // Destructure email from req.user
  const { email } = req.user;

  // Use lean() to improve performance
  const user = await User.findOne({ email }).lean();

  // Use lean() to improve performance
  let cart = await Cart.findOne({ orderdBy: user._id })
    .populate("products.product", "_id title price totalAfterDiscount")
    .lean();

  const { products, cartTotal, totalAfterDiscount } = cart;
  res.json({ products, cartTotal, totalAfterDiscount });
};

exports.emptyCart = async (req, res) => {
  // Destructure email from req.user
  const { email } = req.user;

  const user = await User.findOne({ email }).exec();

  const cart = await Cart.findOneAndRemove({ orderdBy: user._id }).exec();
  res.json(cart);
};

exports.saveAddress = async (req, res) => {
  const userAddress = await User.findOneAndUpdate(
    { email: req.user.email },
    { address: req.body.address }
  ).exec();

  res.json({ ok: true });
};
