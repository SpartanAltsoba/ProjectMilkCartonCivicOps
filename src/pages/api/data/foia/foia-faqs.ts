import type { NextApiRequest, NextApiResponse } from "next";
import { logger } from "../../../../lib/logger";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  lastUpdated: string;
}

interface ApiResponse {
  success: boolean;
  data?: FAQ[];
  message?: string;
  error?: string;
}

const foiaFaqs: FAQ[] = [
  {
    id: "foia-001",
    question: "How long does it take to process a FOIA request?",
    answer:
      "Processing times vary by jurisdiction but typically range from 5 to 20 business days. Complex requests may take longer.",
    category: "Processing",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "foia-002",
    question: "Are there any fees associated with FOIA requests?",
    answer:
      "Some jurisdictions may charge fees for search, duplication, or review of records. Many agencies waive fees for small requests.",
    category: "Fees",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "foia-003",
    question: "Can I request records electronically?",
    answer:
      "Yes, many agencies provide electronic delivery of records upon request. This is often faster and more cost-effective.",
    category: "Delivery",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "foia-004",
    question: "What types of records can I request?",
    answer:
      "You can request any federal agency records that are not exempt from disclosure under FOIA exemptions.",
    category: "Scope",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "foia-005",
    question: "What information should I include in my FOIA request?",
    answer:
      "Be as specific as possible about the records you want, including dates, names, and subject matter. This helps agencies locate records more efficiently.",
    category: "Best Practices",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "foia-006",
    question: "Can my FOIA request be denied?",
    answer:
      "Yes, agencies can deny requests if records fall under one of nine FOIA exemptions, such as national security or personal privacy.",
    category: "Exemptions",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "foia-007",
    question: "What if I disagree with an agency's response?",
    answer:
      "You can file an administrative appeal with the agency, and if that fails, you may file a lawsuit in federal court.",
    category: "Appeals",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "foia-008",
    question: "Do state and local governments have to comply with FOIA?",
    answer:
      "No, federal FOIA only applies to federal agencies. State and local governments have their own public records laws.",
    category: "Jurisdiction",
    lastUpdated: new Date().toISOString(),
  },
];

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      return res.status(405).json({
        success: false,
        error: "Method not allowed",
        message: "Only GET requests are allowed",
      });
    }

    const { category } = req.query;

    let filteredFaqs = foiaFaqs;

    // Filter by category if provided
    if (category && typeof category === "string") {
      filteredFaqs = foiaFaqs.filter(faq => faq.category.toLowerCase() === category.toLowerCase());
    }

    logger.info("FOIA FAQs retrieved", {
      category: category || "all",
      count: filteredFaqs.length,
      timestamp: new Date().toISOString(),
    });

    return res.status(200).json({
      success: true,
      data: filteredFaqs,
      message: `Retrieved ${filteredFaqs.length} FOIA FAQ${filteredFaqs.length === 1 ? "" : "s"}`,
    });
  } catch (error) {
    logger.error("FOIA FAQs API error:", error as Error);

    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "An unexpected error occurred while retrieving FOIA FAQs",
    });
  }
}
