/**
 * Purpose: Registers authenticated project routes, including Multer-powered
 * certification uploads.
 */

const path = require('path');
const express = require('express');
const multer = require('multer');

const authMiddleware = require('../middleware/authMiddleware');
const {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  getApprovedPortfolio
} = require('../controllers/projectController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension).replace(/\s+/g, '-');
    cb(null, `${Date.now()}-${baseName}${extension}`);
  }
});

const upload = multer({ storage });
const router = express.Router();

router.use(authMiddleware);
router.get('/portfolio', getApprovedPortfolio);
router.get('/', getProjects);
router.post('/', upload.single('certificationFile'), createProject);
router.put('/:id', upload.single('certificationFile'), updateProject);
router.delete('/:id', deleteProject);

module.exports = router;
