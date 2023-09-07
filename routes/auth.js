const express = require('express');
const router = express.Router();

router.get('/create', (req, res) => {
    res.status(200).json({ data: 'Create user route' });
});

module.express = router;