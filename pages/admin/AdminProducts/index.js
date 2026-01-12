'use client';

import styles from './shopproduct.module.scss';
import { useState, useEffect } from 'react';
import { FaEdit, FaPlus, FaTrash } from 'react-icons/fa';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [loading, setLoading] = useState(false);

  const [productOptions, setProductOptions] = useState([]);

  const [form, setForm] = useState({
    id: '',
    productName: '',
    salePrice: '',
    originalPrice: '',
    quantity: '',
    saleQuantity: '',
    remainingQuantity: '',
    purchaseDate: '',
  });

  /* ================= FETCH PRODUCTS ================= */

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/adminproducts');
      const data = await res.json();
      setProducts(data.data || []);
    } catch (err) {
      console.error('Fetch failed', err);
    }
  };

  const fetchProductsTitle = async () => {
    try {
      const res = await fetch('/api/adminproducttitle');
      const data = await res.json();
      setProductOptions(data.data || []);
    } catch (err) {
      console.error('Fetch failed', err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchProductsTitle()
  }, []);

  /* ================= AUTO CALC ================= */

  useEffect(() => {
    const remaining =
      Number(form.quantity || 0) - Number(form.saleQuantity || 0);
    setForm((prev) => ({ ...prev, remainingQuantity: remaining }));
  }, [form.quantity, form.saleQuantity]);

  /* ================= MODAL ================= */

  const openAddModal = () => {
    setForm({
      id: '',
      productName: '',
      salePrice: '',
      originalPrice: '',
      quantity: '',
      saleQuantity: '',
      remainingQuantity: '',
      purchaseDate: '',
    });
    setEditProduct(null);
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setForm(product);
    setEditProduct(product);
    setShowModal(true);
  };

  /* ================= HANDLERS ================= */

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addNewProductName = async (e) => {
    if (e.key === 'Enter' && e.target.value) {
      setProductOptions((prev) => [...prev, e.target.value]);
      const method = 'POST';

      const res = await fetch('/api/adminproducttitle', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error('Save failed');
      setForm({ ...form, productName: e.target.value });
      e.target.value = '';
    }
  };

  /* ================= SAVE (ADD / UPDATE) ================= */

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const method = editProduct ? 'PUT' : 'POST';

      const res = await fetch('/api/adminproducts', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error('Save failed');

      await fetchProducts();
      setShowModal(false);
    } catch (err) {
      alert('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this product?'
    );

    if (!confirmDelete) return;

    try {
      setLoading(true);

      const res = await fetch('/api/adminproducts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error('Delete failed');

      await fetchProducts(); // refresh list
      alert('Product deleted successfully');
    } catch (err) {
      alert('Delete failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Shop Products</h1>
        <button className={styles.addBtn} onClick={openAddModal}>
          <FaPlus /> Add Product
        </button>
      </div>

      {/* ===== PRODUCT LIST ===== */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Id</th>
              <th>Product</th>
              <th>Sale Price</th>
              <th>Qty</th>
              <th>Remaining</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 && (
              <tr>
                <td colSpan="6" className={styles.empty}>
                  No products added
                </td>
              </tr>
            )}

            {products.map((item, index) => (
              <tr key={item.id}>
                <td>{index+1}</td>
                <td>{item.productName}</td>
                <td>₹{item.salePrice}</td>
                <td>{item.quantity}</td>
                <td>{item.remainingQuantity}</td>
                <td>{item.purchaseDate}</td>
                <td className={styles.actionBtns}>
                  <button
                    className={styles.editBtn}
                    onClick={() => openEditModal(item)}
                    title="Edit"
                  >
                    <FaEdit />
                  </button>

                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(item.id)}
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ===== MODAL ===== */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>{editProduct ? 'Edit Product' : 'Add Product'}</h2>

            <form onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label>Product Name</label>
                <select
                  name="productName"
                  value={form.productName}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Product</option>
                  {productOptions.map((p, i) => (
                    <option key={i} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Add new product & press Enter"
                  onKeyDown={addNewProductName}
                />
              </div>

              <div className={styles.grid}>
                <div className={styles.field}>
                  <label>Sale Price</label>
                  <input type="number" name="salePrice" value={form.salePrice} onChange={handleChange} required />
                </div>

                <div className={styles.field}>
                  <label>Original Price</label>
                  <input type="number" name="originalPrice" value={form.originalPrice} onChange={handleChange} required />
                </div>
              </div>

              <div className={styles.grid}>
                <div className={styles.field}>
                  <label>Total Qty</label>
                  <input type="number" name="quantity" value={form.quantity} onChange={handleChange} required />
                </div>

                <div className={styles.field}>
                  <label>Sale Qty</label>
                  <input type="number" name="saleQuantity" value={form.saleQuantity} onChange={handleChange} required />
                </div>
              </div>

              <div className={styles.field}>
                <label>Remaining Qty</label>
                <input value={form.remainingQuantity} disabled />
              </div>

              <div className={styles.field}>
                <label>Purchase Date</label>
                <input type="date" name="purchaseDate" value={form.purchaseDate} onChange={handleChange} required />
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.saveBtn} disabled={loading}>
                  {loading ? 'Saving...' : editProduct ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
