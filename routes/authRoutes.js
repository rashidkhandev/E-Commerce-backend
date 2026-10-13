import express from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
} from '../controllers/authController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
import {
  validateRegisterInput,
  validateLoginInput,
} from '../validators/authValidator.js';

const router = express.Router();

router.post('/register', validateRegisterInput, registerUser);
router.post('/login', validateLoginInput, loginUser);
router.post('/logout', logoutUser);
router.get('/me', authenticateUser, getMe);

export default router;
