const Category = require("../models/category");
const Product = require("../models/product");
const Sub = require("../models/sub");
const slugify = require("slugify");

exports.create = async (req, res) => {
  try {
      const { name } = req.body;

      // Basic input validation
      if (!name) {
          return res.status(400).send('Name is required');
      }

      const category = await new Category({ name, slug: slugify(name) }).save();
      res.status(200).json(category);
  } catch (error) {
      res.status(400).send('Create category failed');
  }
};


exports.list = async (req, res) => {
  res.json(await Category.find({}).sort({ createdAt: -1 }).exec());
};

exports.read = async (req, res) => {
  try {
    const slugParams = req.params.slug;
    
    if (!slugParams) {
      return res.status(400).send('Slug parameter is missing');
    }

    let category = await Category.findOne({ slug: slugParams }).exec();

    if (!category) {
      return res.status(404).send('Category not found');
    }

    const products = await Product.find({ category }).populate("category").exec();

    if (!products) {
      return res.status(404).send('Products not found');
    }

    res.status(200).json({
      category,
      products,
    });
  } catch (error) {
    res.status(500).send('Failed to get category');
  }
};


exports.update = async (req, res) => {
  const { name } = req.body;
  try {
    // Find the category by slug and update its properties
    const updated = await Category.findOneAndUpdate(
      { slug: req.params.slug },
      { name, slug: slugify(name) },
      { new: true }
    );

    // If no category is found with the given slug, return 404 status code
    if (!updated) {
      return res.status(404).send('Category not found');
    }

    // Return the updated category with a 200 status code
    res.status(200).json(updated);
  } catch (error) {
    // Handle any errors that occur during the update process
    res.status(400).send('Update category failed');
  }
};


exports.remove = async (req, res) => {
  try {
    // Find the category by slug and delete it
    const deleted = await Category.findOneAndDelete({ slug: req.params.slug });

    // If no category is found with the given slug, return 404 status code
    if (!deleted) {
      return res.status(404).send('Category not found');
    }

    // Return the deleted category with a 200 status code
    res.status(200).json(deleted);
  } catch (error) {
    // Handle any errors that occur during the delete process
    res.status(400).send("Delete category failed");
  }
};

exports.getSubs = async (req, res) => {
  try {
    const subs = await Sub.find({ parent: req.params._id }).exec();
    res.json(subs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching subs' });
  }
}