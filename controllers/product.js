const Product = require("../models/product");
const User = require("../models/user");
const slugify = require("slugify");

exports.create = async (req, res) => {
  try {
    req.body.slug = slugify(req.body.title);
    const newProduct = await new Product(req.body).save();
    res.json(newProduct);
  } catch (err) {
    console.log(err);
    res.status(400).send("Create product failed");
  }
};

exports.listAll = async (req, res) => {
  try {
    let products = await Product.find({})
      .limit(parseInt(req.params.count))
      .populate("category")
      .populate("subs")
      .sort([["createdAt", "desc"]])
      .exec();
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching products' });
  }
}

exports.remove = async (req, res) => {
  try {
    const deleted = await Product.findOneAndRemove({
      slug: req.params.slug,
    }).exec();
    res.json(deleted);
  } catch (err) {
    console.log(err);
    return res.staus(400).send("Product delete failed");
  }
};

exports.read = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug })
      .populate("category")
      .populate("subs");
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching product' });
  }
}

exports.update = async (req, res) => {
  try {
    if (req.body.title) {
      req.body.slug = slugify(req.body.title);
    }
    const updated = await Product.findOneAndUpdate(
      { slug: req.params.slug },
      req.body,
      { new: true }
    ).exec();
    res.json(updated);
  } catch (err) {
    res.status(400).json({
      err: err.message,
    });
  }
};

// Without Pagination
// exports.list = async (req, res) => {
//   try {
//     const { sort, order, limit } = req.body;
//     const products = await Product.find({})
//       .populate("category")
//       .populate("subs")
//       .sort([[sort, order]])
//       .limit(limit)
//       .exec();

//     res.json(products);
//   } catch (err) {
//     res.status(500).json({
//       err: err.message,
//     });
//   }
// };

// WITH PAGINATION
exports.list = async (req, res) => {
  try {
    const { sort, order, page } = req.body;
    const currentPage = page || 1;
    const perPage = 3;

    const products = await Product.find({})
      .skip((currentPage - 1) * perPage)
      .populate("category")
      .populate("subs")
      .sort([[sort, order]])
      .limit(perPage)
      .exec();

    res.json(products);
  } catch (err) {
    res.status(500).json({
      err: err.message,
    });
  }
};

exports.productsCount = async (req, res) => {
  try {
    let total = await Product.find({}).estimatedDocumentCount().exec();
    res.json(total);
  } catch (err) {
    res.status(500).json({
      err: err.message,
    });
  }
};

exports.productStar = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId).exec();
    const user = await User.findOne({ email: req.user.email }).exec();
    const { star } = req.body;

    let existingRatingObject = product.ratings.find(
      (ele) => ele.postedBy.toString() === user._id.toString()
    );

    if (existingRatingObject === undefined) {
      let ratingAdded = await Product.findByIdAndUpdate(
        product._id,
        {
          $push: { ratings: { star, postedBy: user._id } },
        },
        { new: true }
      ).exec();
      res.json(ratingAdded);
    } else {
      const ratingUpdated = await Product.updateOne(
        {
          ratings: { $elemMatch: existingRatingObject },
        },
        { $set: { "ratings.$.star": star } },
        { new: true }
      ).exec();
      res.json(ratingUpdated);
    }
  } catch (err) {
    res.status(500).json({
      err: err.message,
    });
  }
};

exports.listRelated = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId).exec();
    const related = await Product.find({
      _id: { $ne: product._id },
      category: product.category,
    })
      .limit(3)
      .populate("category")
      .populate("subs")
      .populate("ratings.postedBy")
      .exec();
    res.json(related);
  } catch (err) {
    res.status(500).json({
      err: err.message,
    });
  }
};

// SERACH / FILTER
const handleQuery = async (req, res, query) => {
  const products = await Product.find({ $text: { $search: query } })
    .populate("category", "_id name")
    .populate("subs", "_id name")
    .populate("ratings.postedBy", "_id name")
    .exec();
  res.json(products);
};

const handlePrice = async (req, res, price) => {
  try {
    let products = await Product.find({
      price: {
        $gte: price[0],
        $lte: price[1],
      },
    })
      .populate("category", "_id name")
      .populate("subs", "_id name")
      .populate("ratings.postedBy", "_id name")
      .exec();

    res.json(products);
  } catch (err) {
    console.log(err);
  }
};

const handleCategory = async (req, res, category) => {
  try {
    let products = await Product.find({
      "category": { 
        "$in": category 
      }
    })
      .populate("category", "_id name")
      .populate("subs", "_id name")
      .populate("ratings.postedBy", "_id name")
      .exec();
    res.json(products);
  } catch (err) {
    console.log(err);
  }
};

const handleStar = async (req, res, stars) => {
  try {
    const aggregates = await Product.aggregate([
      {
        $project: {
          document: "$$ROOT",
          floorAverage: {
            $floor: { $avg: "$ratings.star" }, // floor value of 3.33 will be 3
          },
        },
      },
      { $match: { floorAverage: stars } },
    ]).limit(12);

    const ids = aggregates.map(a => a.document._id);

    const products = await Product.find({ _id: { $in: ids } })
      .populate("category", "_id name")
      .populate("subs", "_id name")
      .populate("ratings.postedBy", "_id name")

    res.json(products);
  } catch (err) {
    console.log("ERROR", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const handleSub = async (req, res, sub) => {
  const products = await Product.find({ subs: sub })
    .populate("category", "_id name")
    .populate("subs", "_id name")
    .populate("ratings.postedBy", "_id name")
    .exec();

  res.json(products);
};

const handleShipping = async (req, res, shipping) => {
  const products = await Product.find({ shipping })
    .populate("category", "_id name")
    .populate("subs", "_id name")
    .populate("ratings.postedBy", "_id name")
    .exec();

  res.json(products);
};

const handleColor = async (req, res, color) => {
  const products = await Product.find({ color })
    .populate("category", "_id name")
    .populate("subs", "_id name")
    .populate("ratings.postedBy", "_id name")
    .exec();

  res.json(products);
};

const handleBrand = async (req, res, brand) => {
  const products = await Product.find({ brand })
    .populate("category", "_id name")
    .populate("subs", "_id name")
    .populate("ratings.postedBy", "_id name")
    .exec();

  res.json(products);
};


exports.searchFilters = async (req, res) => {
  const {
    query,
    price,
    category,
    stars,
    sub,
    shipping,
    color,
    brand,
  } = req.body;

  if (query) {
    console.log("query", query);
    await handleQuery(req, res, query);
  }

  // price [20, 200]
  if (price !== undefined) {
    await handlePrice(req, res, price);
  }

  if (category) {
    await handleCategory(req, res, category);
  }

  if (stars) {
    await handleStar(req, res, stars);
  }

  if (sub) {
    console.log("sub ---> ", sub);
    await handleSub(req, res, sub);
  }

  if (shipping) {
    console.log("shipping ---> ", shipping);
    await handleShipping(req, res, shipping);
  }

  if (color) {
    console.log("color ---> ", color);
    await handleColor(req, res, color);
  }

  if (brand) {
    console.log("brand ---> ", brand);
    await handleBrand(req, res, brand);
  }
};