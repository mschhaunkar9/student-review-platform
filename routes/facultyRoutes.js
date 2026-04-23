/**
 * Purpose: Defines faculty-only routes for reviewing student projects and
 * updating approval status.
 */

const express = require('express');

const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');
const {
  getAllProjects,
  updateProjectStatus
} = require('../controllers/facultyController');

const router = express.Router();

router.get('/projects', verifyToken, authorizeRole('faculty'), getAllProjects);
router.put('/projects/:id', verifyToken, authorizeRole('faculty'), updateProjectStatus);

module.exports = router;
