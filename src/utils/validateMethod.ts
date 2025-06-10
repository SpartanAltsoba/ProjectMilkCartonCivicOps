import { NextApiRequest, NextApiResponse } from "next";

export const validateMethod = (
  req: NextApiRequest,
  res: NextApiResponse,
  allowedMethods: string[]
): boolean => {
  if (!req.method || !allowedMethods.includes(req.method)) {
    res.setHeader("Allow", allowedMethods);
    res.status(405).json({ error: `Method ${req.method} not allowed` });
    return false;
  }
  return true;
};
