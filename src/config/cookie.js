const defaults = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/",
};

const setCookie = (res, name, value, options = {}) => {
  res.cookie(name, value, {
    ...defaults,
    ...options,
  });
};

const clearCookie = (res, name, options = {}) => {
  res.clearCookie(name, {
    ...defaults,
    ...options,
  });
};

export { setCookie, clearCookie };
