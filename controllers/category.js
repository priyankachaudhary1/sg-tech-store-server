const Category = require("../models/category");
const slugify = require("slugify");

exports.create = async (req, res) => {
    try {
      const { name } = req.body;
      const category = await new Category({name, slug: slugify(name)}).save();
      res.json(category);
    } catch (error) {
      res.status(400).send('Create category failed'); 
    }
};

exports.list = async (req, res) => {
  res.json(await Category.find({}).sort({ createdAt: -1 }).exec());
};

exports.read = async (req, res) => {
  let category = await Category.findOne({ slug: req.params.slug }).exec(); 
};

exports.update = async (req, res) => {
  const { name } = req.body;
  try {
   const updated = await Category.findOneAndUpdate(
      { slug: req.params.slug },
      { name, slug: slugify(name) },
      { new: true }
    );
    res.json(updated);
  } catch (error) {
    
  }
};

exports.remove = async (req, res) => {
  try {
   const deleted = await Category.findOneAndDelete({ slug: req.params.slug });
    res.json(deleted);
  } catch (error) {
    res.status(400).send("Create delete failed");
  }
};