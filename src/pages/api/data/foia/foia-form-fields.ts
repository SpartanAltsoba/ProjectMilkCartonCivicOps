import type { NextApiRequest, NextApiResponse } from "next";

interface FormField {
  name: string;
  label: string;
  type: string;
  required: boolean;
}

const formFields: FormField[] = [
  { name: "requesterName", label: "Requester Name", type: "text", required: true },
  { name: "requesterEmail", label: "Requester Email", type: "email", required: true },
  { name: "requesterPhone", label: "Requester Phone", type: "tel", required: false },
  { name: "subject", label: "Subject of Request", type: "text", required: true },
  { name: "description", label: "Description", type: "textarea", required: true },
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    return res.status(200).json(formFields);
  } catch (_error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}
