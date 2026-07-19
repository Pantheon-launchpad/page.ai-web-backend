/**
 * Standard success envelope per API_CONTRACT.md: { data, message? }
 */
export const sendSuccess = (res, { data = null, message, status = 200 } = {}) => {
  const body = { data };
  if (message) body.message = message;
  return res.status(status).json(body);
};
