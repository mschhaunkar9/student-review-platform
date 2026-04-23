/**
 * Purpose: Manages student-owned project CRUD operations, certification file
 * uploads, and approved portfolio retrieval.
 */

const Project = require('../models/Project');

const formatProjectPayload = (project, filePath) => ({
  title: project.title,
  description: project.description,
  githubUrl: project.githubUrl,
  certificationFile: filePath !== undefined ? filePath : project.certificationFile,
  status: 'pending'
});

const getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ studentId: req.user.id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    next(error);
  }
};

const createProject = async (req, res, next) => {
  try {
    const { title, description, githubUrl } = req.body;

    if (!title || !description || !githubUrl) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and GitHub URL are required'
      });
    }

    const project = await Project.create({
      studentId: req.user.id,
      ...formatProjectPayload(req.body, req.file ? req.file.path : '')
    });

    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
};

const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      studentId: req.user.id
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const { title, description, githubUrl } = req.body;

    if (!title || !description || !githubUrl) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and GitHub URL are required'
      });
    }

    project.title = title;
    project.description = description;
    project.githubUrl = githubUrl;
    project.certificationFile = req.file ? req.file.path : project.certificationFile;
    project.status = 'pending';

    await project.save();

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
};

const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      studentId: req.user.id
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      data: { id: req.params.id }
    });
  } catch (error) {
    next(error);
  }
};

const getApprovedPortfolio = async (req, res, next) => {
  try {
    const projects = await Project.find({
      studentId: req.user.id,
      status: 'approved'
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  getApprovedPortfolio
};
