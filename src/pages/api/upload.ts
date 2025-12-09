import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

function parseForm(req: NextApiRequest): Promise<{ files: unknown }> {
  return new Promise((resolve, reject) => {
    const form = formidable({ multiples: false, maxFileSize: 5 * 1024 * 1024 });
    form.parse(req, (err: unknown, _fields: unknown, files: unknown) => {
      if (err) return reject(err);
      resolve({ files });
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  try {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const { files } = await parseForm(req);
    const raw = (files as Record<string, unknown>).file;
    const file = Array.isArray(raw) ? raw[0] : raw;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const mimetype: string = file.mimetype ?? '';
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(mimetype)) {
      return res.status(400).json({ error: 'Invalid file type' });
    }

    const safeName = String(file.originalFilename || 'image').replace(/[^a-zA-Z0-9._-]/g, '');
    const filename = `${Date.now()}_${safeName}`;
    const dest = path.join(uploadsDir, filename);

    fs.copyFileSync(file.filepath, dest);

    return res.status(200).json({ filename });
  } catch (e) {
    console.error('Upload error:', e);
    return res.status(500).json({ error: 'Upload failed' });
  }
}
