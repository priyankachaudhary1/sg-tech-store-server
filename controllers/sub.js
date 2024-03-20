const Sub = require("../models/sub");
const Product = require("../models/product");
const slugify = require("slugify");

exports.create = async (req, res) => {
  try {
    const { name, parent } = req.body;
    if (!name) throw new Error("Name is required");
    if (!parent) throw new Error("Parent category is required");
    const sub = await new Sub({ name, slug: slugify(name), parent }).save();
    res.status(201).json(sub);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Duplicate name value entered.' });
    }
    res.status(400).json({ error: err.message || "Create sub failed" });
  }
};

exports.list = async (req, res) => {
  try {
    const subs = await Sub.find({}).sort({ createdAt: -1 }).exec();
    res.json(subs);
  } catch (err) {
    res.status(400).json({ error: "Error fetching subs" });
  }
};

exports.read = async (req, res) => {
  try {
    const sub = await Sub.findOne({ slug: req.params.slug }).exec();
    if (!sub) throw new Error('Sub not found');
    const products = await Product.find({ subs: sub })
      .populate("category")
      .exec();

    res.json({
      sub,
      products,
    });
  } catch (err) {
    res.status(400).json({ error: err.message || "Error fetching sub" });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, parent } = req.body;
    if (!name) throw new Error('Name is required');
    const updated = await Sub.findOneAndUpdate(
      { slug: req.params.slug },
      { name, slug: slugify(name), parent },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message || "Sub update failed" });
  }
};

exports.remove = async (req, res) => {
  try {
    const deleted = await Sub.findOneAndDelete({ slug: req.params.slug });
    if (!deleted) throw new Error('Sub not found');
    res.json(deleted);
  } catch (err) {
    res.status(400).json({ error: err.message || "Sub delete failed" });
  }
};