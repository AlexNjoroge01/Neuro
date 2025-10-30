import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const form = formidable({ multiples: false, maxFileSize: 5 * 1024 * 1024 });

  form.parse(req, (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'Upload error' });
    const file = files.file as formidable.File;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.mimetype ?? '')) {
      return res.status(400).json({ error: 'Invalid file type' });
    }
    const filename = Date.now() + '_' + file.originalFilename?.replace(/[^a-zA-Z0-9.]/g, "");
    const dest = path.join(uploadsDir, filename);
    fs.copyFileSync(file.filepath, dest);
    res.status(200).json({ filename });
  });
}
