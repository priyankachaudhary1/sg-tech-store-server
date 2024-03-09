const express = require("express");
const router = express.Router();

// middlewares
const { authCheck, adminCheck } = require("../middlewares/auth");

// controller
const { create, read, listAll} = require("../controllers/product");

// routes
router.post("/product", authCheck, adminCheck, create);
router.get("/products", read);
router.get("/products/:count", listAll);

module.exports = router;