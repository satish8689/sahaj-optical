'use client';

import Link from 'next/link';
import styles from './report.module.scss';
import { useState, useEffect } from 'react';
import { FaEdit, FaPlus, FaTrash } from 'react-icons/fa';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiLoading, setApiLoading] = useState(false);
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
      setProducts(data?.data?.reverse() || []);
      setApiLoading(false)
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
    setApiLoading(true);
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
    setForm({
      ...product,
      productName:
        typeof product.productName === 'object'
          ? product.productName.productName
          : product.productName,
    });
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
        Reports page
    </div>
  );
}
