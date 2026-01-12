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
  process.env.NEXT_PUBLIC_GITHUB_FILE_PATH + '/users.json';
const branch = process.env.NEXT_PUBLIC_GITHUB_BRANCH || 'main';

/* ================= HELPERS ================= */

async function fetchFileFromGitHub() {
  try {
    const { data } = await octokit.request(
      'GET /repos/{owner}/{repo}/contents/{path}',
      { owner, repo, path: filePath, ref: branch }
    );

    const content = Buffer.from(data.content, 'base64').toString('utf8');
    return { items: JSON.parse(content || '[]'), sha: data.sha };
  } catch (error) {
    // If file does not exist, return empty list
    if (error.status === 404) {
      return { items: [], sha: null };
    }
    throw error;
  }
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

    /* ===== GET ALL CUSTOMERS ===== */
    if (req.method === 'GET') {
      return res.status(200).json({ data: items });
    }

    /* ===== ADD CUSTOMER ===== */
   if (req.method === 'POST') {
  const { name, mobile, address } = req.body;

  // ✅ basic validation
  if (!name || !mobile) {
    return res.status(400).json({
      error: 'Name and mobile number are required',
    });
  }

  // ✅ UNIQUE MOBILE CHECK
  const mobileExists = items.find(
    (item) => item.mobile === mobile
  );

  if (mobileExists) {
    return res.status(201).json({
      message: 'Customer added successfully',
    });
  }

  const newCustomer = {
    id: Date.now().toString(),
    name,
    mobile,
    address,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updatedItems = [...items, newCustomer];
  await writeFileToGitHub(updatedItems, 'Add customer', sha);

  return res.status(201).json({
    message: 'Customer added successfully',
    item: newCustomer,
  });
}

    /* ===== UPDATE CUSTOMER ===== */
    if (req.method === 'PUT') {
      const updatedCustomer = req.body;

      const updatedItems = items.map((item) =>
        item.id === updatedCustomer.id
          ? {
              ...item,
              name: updatedCustomer.name,
              mobile: updatedCustomer.mobile,
              address: updatedCustomer.address,
              updatedAt: new Date().toISOString(),
            }
          : item
      );

      await writeFileToGitHub(updatedItems, 'Update customer', sha);

      return res.status(200).json({
        message: 'Customer updated successfully',
        item: updatedCustomer,
      });
    }

    /* ===== DELETE CUSTOMER ===== */
    if (req.method === 'DELETE') {
      const { id } = req.body;

      const updatedItems = items.filter(
        (item) => item.id !== id
      );

      await writeFileToGitHub(updatedItems, 'Delete customer', sha);

      return res.status(200).json({
        message: 'Customer deleted successfully',
        id,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Customer API Error:', error);
    return res.status(500).json({
      error: 'GitHub operation failed',
      detail: error.message,
    });
  }
}
