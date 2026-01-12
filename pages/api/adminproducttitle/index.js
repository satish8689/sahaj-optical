import { Octokit } from 'octokit';

export const config = {
  api: {
    bodyParser: true,
  },
};

const octokit = new Octokit({
  auth: process.env.NEXT_PUBLIC_GITHUB_TOKEN,
});

const [owner, repo] = process.env.NEXT_PUBLIC_GITHUB_REPO.split('/');
const filePath =
  process.env.NEXT_PUBLIC_GITHUB_FILE_PATH + '/adminitemtitle.json';
const branch = process.env.NEXT_PUBLIC_GITHUB_BRANCH || 'main';

/* ================= HELPERS ================= */

async function fetchFileFromGitHub() {
  const { data } = await octokit.request(
    'GET /repos/{owner}/{repo}/contents/{path}',
    { owner, repo, path: filePath, ref: branch }
  );

  const content = Buffer.from(data.content, 'base64').toString('utf8');
  return { items: JSON.parse(content || '[]'), sha: data.sha };
}

async function writeFileToGitHub(items, message, sha) {
  const encoded = Buffer.from(
    JSON.stringify(items, null, 2)
  ).toString('base64');

  await octokit.request(
    'PUT /repos/{owner}/{repo}/contents/{path}',
    {
      owner,
      repo,
      path: filePath,
      message,
      content: encoded,
      sha,
      branch,
    }
  );
}

/* ================= API HANDLER ================= */

export default async function handler(req, res) {
  try {
    const { items, sha } = await fetchFileFromGitHub();

    /* ===== GET ALL PRODUCTS ===== */
    if (req.method === 'GET') {
      return res.status(200).json({ data: items });
    }

    /* ===== ADD Product title ===== */
    if (req.method === 'POST') {
      const newItem = {
        id: Date.now().toString(),
        productName: req.body.productName,
        salePrice: Number(req.body.salePrice),
        originalPrice: Number(req.body.originalPrice),
        quantity: Number(req.body.quantity),
        saleQuantity: Number(req.body.saleQuantity),
        remainingQuantity:
          Number(req.body.quantity) -
          Number(req.body.saleQuantity),
        purchaseDate: req.body.purchaseDate,
        createdAt: new Date().toISOString(),
      };

      const updatedItems = [...items, newItem];
      await writeFileToGitHub(updatedItems, 'Add product', sha);

      return res.status(201).json({
        message: 'Product title added successfully',
        item: newItem,
      });
    }

    /* ===== UPDATE Product title ===== */
    if (req.method === 'PUT') {
      const updatedItem = req.body;

      const updatedItems = items.map((item) =>
        item.id === updatedItem.id
          ? {
              ...item,
              ...updatedItem,
              remainingQuantity:
                Number(updatedItem.quantity) -
                Number(updatedItem.saleQuantity),
            }
          : item
      );

      await writeFileToGitHub(updatedItems, 'Update product', sha);

      return res.status(200).json({
        message: 'Product title updated successfully',
        item: updatedItem,
      });
    }

    /* ===== DELETE Product title ===== */
    if (req.method === 'DELETE') {
      const { id } = req.body;

      const updatedItems = items.filter(
        (item) => item.id !== id
      );

      await writeFileToGitHub(updatedItems, 'Delete product', sha);

      return res.status(200).json({
        message: 'Product title deleted successfully',
        id,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Admin Product title API Error:', error);
    return res.status(500).json({
      error: 'GitHub operation failed',
      detail: error.message,
    });
  }
}
