import jwt from 'jsonwebtoken';

/**
 * Generate JWT token and attach as HTTP-Only Cookie to response.
 * Also returns the token string for authorization headers.
 */
export const generateTokenAndSetCookie = (res, userId) => {
  const secret = process.env.JWT_SECRET || 'rashid_store_super_secret_jwt_key_2026';
  const expiresIn = process.env.JWT_EXPIRES_IN || '30d';

  const token = jwt.sign({ id: userId }, secret, {
    expiresIn,
  });

  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('jwt', token, {
    httpOnly: true,
    secure: isProduction, // Send only over HTTPS in production
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  return token;
};

export const clearTokenCookie = (res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('jwt', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    expires: new Date(0),
  });
};
