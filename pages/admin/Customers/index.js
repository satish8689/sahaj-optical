'use client';

import Link from 'next/link';
import styles from './customers.module.scss';
import { useState, useEffect } from 'react';
import { FaEdit, FaPlus, FaTrash } from 'react-icons/fa';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const filteredCustomers = customers.filter((item) =>
  item.name.toLowerCase().includes(search.toLowerCase()) ||
  item.mobile.includes(search)
);

  const [form, setForm] = useState({
    id: '',
    name: '',
    mobile: '',
    address: '',
  });

  /* ================= FETCH ================= */

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/admincustomers');
      const data = await res.json();
      setCustomers(data.data || []);
    } catch (err) {
      console.error('Fetch failed', err);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  /* ================= MODAL ================= */

  const openAddModal = () => {
    setForm({ id: '', name: '', mobile: '', address: '' });
    setEditCustomer(null);
    setShowModal(true);
  };

  const openEditModal = (customer) => {
    setForm(customer);
    setEditCustomer(customer);
    setShowModal(true);
  };

  /* ================= HANDLERS ================= */

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* ================= SAVE ================= */

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const method = editCustomer ? 'PUT' : 'POST';

      const payload = {
        ...form,
        updatedAt: new Date().toISOString(),
        createdAt: editCustomer ? form.createdAt : new Date().toISOString(),
      };

      const res = await fetch('/api/admincustomers', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();

      await fetchCustomers();
      setShowModal(false);
    } catch {
      alert('Save failed');
    } finally {
      setLoading(false);
    }
  };

  /* ================= DELETE ================= */

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer?')) return;

    try {
      setLoading(true);

      const res = await fetch('/api/admincustomers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error();

      await fetchCustomers();
    } catch {
      alert('Delete failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Link href="/admin" className={`${styles.backbutton}`}><img src="../icon/back.png" /></Link>
            
      <div className={styles.header}>
        <h1>Customers</h1>
        <input
          type="text"
          placeholder="Search by name or mobile"
          className={styles.searchInput}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className={styles.addBtn} onClick={openAddModal}>
          <FaPlus /> Add Customer
        </button>
      </div>

      {/* ===== TABLE ===== */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Id</th>
              <th>Name</th>
              <th>Mobile</th>
              <th>Address</th>
              <th>Created</th>
              <th>Updated</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length === 0 && (
              <tr>
                <td colSpan="6" className={styles.empty}>No customers found</td>
              </tr>
            )}

            {filteredCustomers.map((c, i) => (
              <tr key={c.id}>
                 <td>{i+1}</td>
                <td>{c.name}</td>
                <td>{c.mobile}</td>
                <td>{c.address}</td>
                <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                <td>{new Date(c.updatedAt).toLocaleDateString()}</td>
                <td className={styles.actionBtns}>
                  <button onClick={() => openEditModal(c)} className={styles.editBtn}>
                    <FaEdit />
                  </button>
                  <button onClick={() => handleDelete(c.id)} className={styles.deleteBtn}>
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
            <h2>{editCustomer ? 'Edit Customer' : 'Add Customer'}</h2>

            <form onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label>Name</label>
                <input name="name" value={form.name} onChange={handleChange} required />
              </div>

              <div className={styles.field}>
                <label>Mobile Number</label>
                <input name="mobile" value={form.mobile} onChange={handleChange} required />
              </div>

              <div className={styles.field}>
                <label>Address</label>
                <textarea name="address" value={form.address} onChange={handleChange} required />
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className={styles.saveBtn} disabled={loading}>
                  {loading ? 'Saving...' : editCustomer ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
