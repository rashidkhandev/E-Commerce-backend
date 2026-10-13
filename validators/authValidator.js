import validator from 'validator';

export const validateRegisterInput = (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ success: false, message: 'Full name is required.' });
  }

  if (!email || !validator.isEmail(email)) {
    return res.status(400).json({ success: false, message: 'A valid email address is required.' });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long.',
    });
  }

  next();
};

export const validateLoginInput = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !validator.isEmail(email)) {
    return res.status(400).json({ success: false, message: 'A valid email address is required.' });
  }

  if (!password || password.trim() === '') {
    return res.status(400).json({ success: false, message: 'Password is required.' });
  }

  next();
};
