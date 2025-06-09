import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { prisma } from '../../../lib/db';

interface FOIARequest {
  id: number;
  title: string;
  description: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

// Handle the API request for FOIA
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    switch (req.method) {
      case 'GET':
        // Fetch the list of FOIA requests
        const foiaRequests = await prisma.foiaRequest.findMany({
          where: { userId: session.user.id },
          orderBy: { createdAt: 'desc' },
        });
        return res.status(200).json(foiaRequests);
      
      case 'POST':
        // Create a new FOIA request
        const { title, description } = req.body;

        if (!title || !description) {
          return res.status(400).json({ message: 'Title and description are required' });
        }

        const newFOIARequest = await prisma.foiaRequest.create({
          data: {
            title,
            description,
            status: 'Pending',
            userId: session.user.id,
          },
        });

        return res.status(201).json(newFOIARequest);

      case 'PUT':
        // Update an existing FOIA request
        const { id, updateData } = req.body;
        if (!id || !updateData) {
          return res.status(400).json({ message: 'ID and update data are required' });
        }

        const updatedFOIARequest = await prisma.foiaRequest.update({
          where: { id },
          data: updateData,
        });

        return res.status(200).json(updatedFOIARequest);

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Error handling FOIA request', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
