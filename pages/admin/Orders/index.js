'use client';

import styles from './orders.module.scss';
import { useState, useEffect } from 'react';
import { FaFile, FaPlus, FaTrash } from 'react-icons/fa';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const emptyPrescription = {
    name: '',
    sphericalR: '',
    sphericalL: '',
    cylindricalR: '',
    cylindricalL: '',
    axisR: '',
    axisL: '',
    pdR: '',
    pdL: '',
    addR: '',
    addL: '',
  };
  const [form, setForm] = useState({
    name: '',
    mobile: '',
    address: '',
    date: '',
    prescriptions: [emptyPrescription],
    remark: '',
    total: 0,
    advance: 0,
    remaining: 0
  });

  const fetchOrders = async () => {
    const res = await fetch('/api/orders');
    const data = await res.json();
    setOrders(data?.data?.reverse() || []);
  };

  useEffect(() => {
    fetchOrders();
  }, []);


  const addPrescription = () => {
    setForm(prev => ({
      ...prev,
      prescriptions: [...prev.prescriptions, { ...emptyPrescription }],
    }));
  };

  const loadImage = (src) =>
    new Promise((resolve) => {
      const img = new Image();
      img.src = src;
      img.onload = () => resolve(img);
    });

  const removePrescription = (i) => {
    const updated = [...form.prescriptions];
    updated.splice(i, 1);
    setForm({ ...form, prescriptions: updated });
  };

  const handlePrescriptionChange = (index, field, value) => {
    const updated = [...form.prescriptions];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setForm({ ...form, prescriptions: updated });
  };

  const remaining = Number(form.total) - Number(form.advance || 0);
  console.log("remaining", remaining)
  const handleSubmit = async () => {

    const cleanedPrescriptions = form.prescriptions.filter(p =>
      Object.values(p).some(v => v !== '')
    );
    const payload = {
      ...form,
      prescriptions: cleanedPrescriptions,
      remaining,
      createdAt: new Date().toISOString(),
    };
    console.log("payload", payload)
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setShowModal(false);
      fetchOrders();
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this order?'
    );

    if (!confirmDelete) return;

    try {
      setLoading(true);

      const res = await fetch('/api/orders', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error('Delete failed');

      await fetchOrders(); // refresh list
      alert('Order deleted successfully');
    } catch (err) {
      alert('Delete failed');
    } finally {
      setLoading(false);
    }
  };

  const generateAndStorePDF = async (order) => {
    const doc = new jsPDF("p", "mm", "a4");

    /* ---------------- LOGO ---------------- */
    const logoImg = await loadImage("/logo.png");
    doc.addImage(logoImg, "PNG", 10, 8, 25, 18);

    /* ---------------- HEADER ---------------- */
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("SAHAJ OPTICAL", 105, 15, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Mobile: +91 96170 93363", 105, 21, { align: "center" });
    doc.text("Address: Kalandi Gold City, Near Aurobindo Hospital, Indore", 105, 23, { align: "center" });

    doc.line(10, 28, 200, 28);

    /* ---------------- CUSTOMER DETAILS ---------------- */
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Customer Details", 10, 36);

    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${order.name}`, 10, 42);
    doc.text(`Mobile: ${order.mobile}`, 70, 42);
    doc.text(`Address: ${order.address}`, 10, 49);
    doc.text(`Date: ${order.date}`, 140, 42);

    /* ---------------- PRESCRIPTION TABLE ---------------- */
    doc.setFont("helvetica", "bold");
    doc.text("Eye Test Prescription", 15, 58);

    const tableBody = [];

    order.prescriptions.forEach((p) => {
      tableBody.push(
        [{ content: `${p.name || "-"}`, colSpan: 3, styles: { fontStyle: "bold" } }],
        ["Spherical", p.sphericalR || "0.00", p.sphericalL || "0.00"],
        ["Cylindrical", p.cylindricalR || "0.00", p.cylindricalL || "0.00"],
        ["Axis", p.axisR || "0.00", p.axisL || "0.00"],
        ["Pupil Distance", p.pdR || "0.00", p.pdL || "0.00"],
        ["Add Power", p.addR || "0.00", p.addL || "0.00"],
        [{ content: " ", colSpan: 3 }]
      );
    });

    doc.autoTable({
      startY: 60,
      head: [["Single Vision", "Right Eye", "Left Eye"]],
      body: tableBody,
      theme: "grid",
      styles: {
        fontSize: 10,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [0, 0, 0],
        textColor: 255,
      },
    });

    /* ---------------- TESTED BY ---------------- */
    let afterTableY = doc.lastAutoTable.finalY + 6;
    doc.setFont("helvetica", "italic");
    doc.text("Tested By: Vikrant Acharya", 15, afterTableY);

    /* ---------------- PAYMENT SUMMARY (RIGHT SIDE) ---------------- */
    let paymentY = afterTableY + 6;
    const rightX = 190;

    doc.setFont("helvetica", "bold");
    doc.text("Payment Summary", rightX, paymentY, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.text(`Total Amount: Rs. ${order.total}`, rightX, paymentY + 6, { align: "right" });
    doc.text(`Advance Paid: Rs. ${order.advance}`, rightX, paymentY + 12, { align: "right" });
    doc.text(`Remaining Amount: Rs. ${order.remaining}`, rightX, paymentY + 18, { align: "right" });

    /* ---------------- FOOTER ---------------- */
    doc.line(10, 280, 200, 280);
    doc.setFontSize(10);
    doc.text("Thank You For Visiting Sahaj Optical", 105, 286, { align: "center" });

    /* ---------------- SAVE ---------------- */
    const fileName = `Sahaj-Optical-Bill-${order.name}-${order.id}.pdf`;
    doc.save(fileName);

    /* ---------------- WHATSAPP REDIRECT ---------------- */
    const phone = order.mobile.replace(/\D/g, "");
    const message = encodeURIComponent(
      `Hello ${order.name},\n\nYour eye test bill from *Sahaj Optical* is ready.\n\nThank you for visiting us.`
    );

    const whatsappUrl = `https://wa.me/91${phone}?text=${message}`;

    setTimeout(() => {
      window.open(whatsappUrl, "_blank");
    }, 9000);
  };


  useEffect(() => {
    document.body.style.overflow = showModal ? "hidden" : "auto";
    return () => (document.body.style.overflow = "auto");
  }, [showModal]);
  return (
    <div className={styles.container}>
      <div className={styles.orderHeader}>
        <h1>Orders</h1>

        <div className={styles.headerRight}>
          <input
            type="text"
            placeholder="Search by name / mobile"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />

          {/* <button className={styles.newOrder} onClick={() => setShowModal(true)}>
            <FaPlus /> New Order
          </button> */}
        </div>
      </div>

      {/* LIST */}
      <div className={styles.list}>
        {orders
          .filter(o =>
            o.name?.toLowerCase().includes(search.toLowerCase()) ||
            o.mobile?.includes(search)
          )
          .map((o) => (
            <div key={o.id} className={styles.card}>

              {/* HEADER */}
              <div className={styles.cardHeader}>
                <div>
                  <h4>{o.name}</h4>
                  <span>{o.mobile}</span>
                </div>

                <div className={styles.amount}>
                  ₹{o.total}
                </div>
              </div>

              {/* PRESCRIPTION */}
              {o.prescriptions?.map((p, i) => (
                <div key={i} className={styles.prescription}>

                  <div className={styles.pRowHeader}>
                    <span>Single Vision</span>
                    <span>Right</span>
                    <span>Left</span>
                  </div>

                  <div className={styles.pRow}>
                    <label>Name</label>
                    <span>{p.name}</span>
                  </div>

                  <div className={styles.pRow}>
                    <label>Spherical</label>
                    <span>{p.sphericalR || '0.00'}</span>
                    <span>{p.sphericalL || '0.00'}</span>
                  </div>

                  <div className={styles.pRow}>
                    <label>Cylindrical</label>
                    <span>{p.cylindricalR || '0.00'}</span>
                    <span>{p.cylindricalL || '0.00'}</span>
                  </div>

                  <div className={styles.pRow}>
                    <label>Axis</label>
                    <span>{p.axisR || '0.00'}</span>
                    <span>{p.axisL || '0.00'}</span>
                  </div>

                  <div className={styles.pRow}>
                    <label>Pupil Dist.</label>
                    <span>{p.pdR || '0.00'}</span>
                    <span>{p.pdL || '0.00'}</span>
                  </div>

                  <div className={styles.pRow}>
                    <label>Add Power</label>
                    <span>{p.addR || '0.00'}</span>
                    <span>{p.addL || '0.00'}</span>
                  </div>

                </div>
              ))}

              {/* FOOTER */}
              <div className={styles.cardFooter}>
                <span>Total ₹{o.total}</span>
                <span>Advance ₹{o.advance}</span>
                <span className={styles.remaining}>
                  Remaining ₹{o.remaining}
                </span>
                <button className={styles.billButton} onClick={() => generateAndStorePDF(o)}>
                  <FaFile />
                </button>
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(o.id)}
                  title="Delete"
                >
                  <FaTrash />
                </button>

              </div>

            </div>
          ))}
      </div>


      {/* MODAL */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>

            <div className={styles.modalHeader}>
              <h2>Create Order</h2>
              <span onClick={() => setShowModal(false)}>✕</span>
            </div>
 <div className={styles.modalContent}>
            {/* CUSTOMER */}
            <div className={styles.section}>
              <h3>Customer Details</h3>

              <div className={styles.grid2}>
                <div className={styles.formGroup}>
                  <label>Name</label>
                  <input onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>

                <div className={styles.formGroup}>
                  <label>Mobile</label>
                  <input onChange={e => setForm({ ...form, mobile: e.target.value })} />
                </div>
              </div>
              <div className={styles.grid2}>
                <div className={styles.formGroup}>
                  <label>Address</label>
                  <input
                    onChange={e => setForm({ ...form, address: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Date</label>
                  <input
                    type="date"
                    onChange={e => setForm({ ...form, date: e.target.value })}
                  />
                </div>
              </div>
            </div>
</div>


            <div className={styles.eyeSection}>
              <h3 className={styles.eyeTitle}>Eye Test Prescription</h3>

              <div className={styles.eyeTable}>

                {/* HEADER */}
                <div className={`${styles.row} ${styles.header}`}>
                  <div>Single Vision</div>
                  <div>Right Eye</div>
                  <div>Left Eye</div>
                </div>

                {form.prescriptions.map((item, idx) => (
                  <div key={idx} className={styles.prescriptionBlock}>

                    {/* NAME */}
                    <div className={styles.row}>
                      <div className={styles.label}>Name</div>
                      <input
                        type="text"
                        placeholder="Enter Name"
                        value={item.name || ''}
                        onChange={e =>
                          handlePrescriptionChange(idx, 'name', e.target.value)
                        }
                      />
                    </div>

                    {/* SPHERICAL */}
                    <div className={styles.row}>
                      <div className={styles.label}>Spherical</div>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={item.sphericalR || ''}
                        onChange={e =>
                          handlePrescriptionChange(idx, 'sphericalR', e.target.value)
                        }
                      />
                      <input
                        type="number"
                        placeholder="0.00"
                        value={item.sphericalL || ''}
                        onChange={e =>
                          handlePrescriptionChange(idx, 'sphericalL', e.target.value)
                        }
                      />
                    </div>

                    {/* CYLINDRICAL */}
                    <div className={styles.row}>
                      <div className={styles.label}>Cylindrical</div>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={item.cylindricalR || ''}
                        onChange={e =>
                          handlePrescriptionChange(idx, 'cylindricalR', e.target.value)
                        }
                      />
                      <input
                        type="number"
                        placeholder="0.00"
                        value={item.cylindricalL || ''}
                        onChange={e =>
                          handlePrescriptionChange(idx, 'cylindricalL', e.target.value)
                        }
                      />
                    </div>

                    {/* AXIS */}
                    <div className={styles.row}>
                      <div className={styles.label}>Axis</div>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={item.axisR || ''}
                        onChange={e =>
                          handlePrescriptionChange(idx, 'axisR', e.target.value)
                        }
                      />
                      <input
                        type="number"
                        placeholder="0.00"
                        value={item.axisL || ''}
                        onChange={e =>
                          handlePrescriptionChange(idx, 'axisL', e.target.value)
                        }
                      />
                    </div>

                    {/* PUPIL DISTANCE */}
                    <div className={styles.row}>
                      <div className={styles.label}>Pupil Distance</div>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={item.pdR || ''}
                        onChange={e =>
                          handlePrescriptionChange(idx, 'pdR', e.target.value)
                        }
                      />
                      <input
                        type="number"
                        placeholder="0.00"
                        value={item.pdL || ''}
                        onChange={e =>
                          handlePrescriptionChange(idx, 'pdL', e.target.value)
                        }
                      />
                    </div>

                    {/* ADD POWER */}
                    <div className={styles.row}>
                      <div className={styles.label}>Add Power</div>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={item.addR || ''}
                        onChange={e =>
                          handlePrescriptionChange(idx, 'addR', e.target.value)
                        }
                      />
                      <input
                        type="number"
                        placeholder="0.00"
                        value={item.addL || ''}
                        onChange={e =>
                          handlePrescriptionChange(idx, 'addL', e.target.value)
                        }
                      />
                    </div>

                    {/* REMOVE */}
                    {form.prescriptions.length > 1 && (
                      <div className={styles.rowfull}>
                        <button
                          type="button"
                          className={styles.removeBtn}
                          onClick={() => removePrescription(idx)}
                        >
                          <FaTrash /> Remove
                        </button>
                      </div>
                    )}
                  </div>
                ))}

              </div>

              {/* ADD MORE */}
              <div className={styles.addMoreWrap}>
                <button onClick={addPrescription}>
                  + Add More Prescription
                </button>
              </div>
            </div>


            {/* PAYMENT */}
            <div className={styles.section}>
              <h3>Payment</h3>


              <div className={styles.formGroup}>
                <label>Total</label>
                {/* <strong>₹{remaining}</strong> */}
                <input
                  type="number"
                  onChange={e => setForm({ ...form, total: e.target.value })}

                />
              </div>
              <div className={styles.formGroup}>
                <label>Advance</label>
                <input
                  type="number"
                  onChange={e => setForm({ ...form, advance: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Remaining</label>
                {/* <div >₹{remaining}</div> */}
                <input
                  // onChange={e => setForm({ ...form, remaining:form.total - form.advance })}
                  value={`₹ ${remaining}`}
                  disabled
                />
              </div>

              <div className={styles.formGroup}>
                <label>Remark</label>
                <input
                  onChange={e => setForm({ ...form, remark: e.target.value })}
                />
              </div>
            </div>

            <div className={styles.footer}>
              <button className={styles.cancel} onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className={styles.save} onClick={handleSubmit}>
                Save Order
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
