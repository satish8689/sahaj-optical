import { Octokit } from 'octokit';
import path from 'path';
import fs from 'fs';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false,
  },
};

const octokit = new Octokit({ auth: process.env.NEXT_PUBLIC_GITHUB_TOKEN });

const [owner, repo] = process.env.NEXT_PUBLIC_GITHUB_REPO.split('/');
const filePath = process.env.NEXT_PUBLIC_GITHUB_FILE_PATH+'/order.json';
const branch = process.env.NEXT_PUBLIC_GITHUB_BRANCH || 'main';

async function fetchFileFromGitHub() {
  const { data } = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
    owner,
    repo,
    path: filePath,
    ref: branch,
  });

  const content = Buffer.from(data.content, 'base64').toString('utf-8');
  return { items: JSON.parse(content), sha: data.sha };
}

async function writeFileToGitHub(updatedItems, message, sha) {
  const encoded = Buffer.from(JSON.stringify(updatedItems, null, 2)).toString('base64');

  await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
    owner,
    repo,
    path: filePath,
    message,
    content: encoded,
    sha,
    branch,
  });
}

export default async function handler(req, res) {
  try {
    // GET current items from GitHub
    const { items, sha } = await fetchFileFromGitHub();

    if (req.method === 'GET') {
      return res.status(200).json({ data: items });
    }

    if (
      req.method === 'POST' &&
      req.headers['content-type']?.includes('multipart/form-data')
    ) {
      const uploadDir = path.join(process.cwd(), 'public', 'stationery-img');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const form = formidable({ uploadDir, keepExtensions: true });
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('Form parse error:', err);
          return res.status(500).json({ error: 'Image upload failed' });
        }

        const file = files.image?.[0];
        if (!file) {
          return res.status(400).json({ error: 'No file uploaded' });
        }

        const fileName = path.basename(file.filepath);
        const filePath = `/stationery-img/${fileName}`;
        return res.status(200).json({ filePath });
      });

      return;
    }

    if (
      req.method === 'POST' &&
      req.headers['content-type']?.includes('application/json')
    ) {
      const buffers = [];
      for await (const chunk of req) buffers.push(chunk);
      const body = Buffer.concat(buffers).toString();
      const newItem = JSON.parse(body);
      newItem.id = Date.now().toString();

      const updatedItems = [...items, newItem];
      await writeFileToGitHub(updatedItems, 'Add item', sha);

      return res.status(201).json({ message: 'Item added', item: newItem });
    }

    if (
      req.method === 'PUT' &&
      req.headers['content-type']?.includes('application/json')
    ) {
      const buffers = [];
      for await (const chunk of req) buffers.push(chunk);
      const body = Buffer.concat(buffers).toString();
      const updatedItem = JSON.parse(body);

      const updatedItems = items.map(item =>
        item.id === updatedItem.id ? { ...item, ...updatedItem } : item
      );

      await writeFileToGitHub(updatedItems, 'Update item', sha);
      return res.status(200).json({ message: 'Item updated', item: updatedItem });
    }

    if (
      req.method === 'DELETE' &&
      req.headers['content-type']?.includes('application/json')
    ) {
      const buffers = [];
      for await (const chunk of req) buffers.push(chunk);
      const body = Buffer.concat(buffers).toString();
      const { id } = JSON.parse(body);

      const updatedItems = items.filter(item => item.id !== id);
      await writeFileToGitHub(updatedItems, 'Delete item', sha);

      return res.status(200).json({ message: 'Item deleted', id });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('GitHub API error:', error);
    return res.status(500).json({ error: 'GitHub write failed', detail: error.message });
  }
}
