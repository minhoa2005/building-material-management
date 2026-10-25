import jwt from "jsonwebtoken";

const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "refresh-secret";

const generateRefreshToken = (userId) => {
  const refreshToken = jwt.sign({ userId }, REFRESH_TOKEN_SECRET, {
    expiresIn: "7d", // Set the expiration time for the refresh token
  });
  return refreshToken;
};

const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET);
    return { success: true, userId: decoded.userId };
  } catch (err) {
    return {
      success: false,
    };
  }
};

export { generateRefreshToken, verifyRefreshToken };
