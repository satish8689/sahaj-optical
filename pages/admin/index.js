'use client';
import Head from "next/head";
import { useEffect, useState } from 'react';
import CryptoJS from 'crypto-js';
import styles from './indexadmin.module.scss';
import AdminProducts from './AdminProducts';
import Customers from './Customers';
import Orders from './Orders';

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPopup, setShowPopup] = useState(true);
  const [activeMenu, setActiveMenu] = useState('products');
  const [sidebarOpen, setSidebarOpen] = useState(false); // 🔥 mobile toggle
  const [showInstallPopup, setShowInstallPopup] = useState(false);

  const SECRET_KEY = 'mySecretKey';
  const VALID_PASSWORD = '998877';

  useEffect(() => {
    const encryptedCode = localStorage.getItem('admin_code');
    if (encryptedCode) {
      const decryptedBytes = CryptoJS.AES.decrypt(encryptedCode, SECRET_KEY);
      const decryptedCode = decryptedBytes.toString(CryptoJS.enc.Utf8);

      if (decryptedCode === VALID_PASSWORD) {
        setIsAuthenticated(true);
        setShowPopup(false);
      }
    }
  }, []);

  const handleSubmit = () => {
    if (password === VALID_PASSWORD) {
      const encryptedCode = CryptoJS.AES.encrypt(password, SECRET_KEY).toString();
      localStorage.setItem('admin_code', encryptedCode);

      setIsAuthenticated(true);
      setShowPopup(false);
    } else {
      alert('Invalid Code!');
    }
  };

  useEffect(() => {
          const handleBeforeInstallPrompt = (e) => {
              e.preventDefault(); // Prevent automatic mini-infobar
              setDeferredPrompt(e); // Save the event for later
              setShowInstallPopup(true); // Show our custom install popup
          };
  
          window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  
          return () => {
              window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
          };
      }, []);
  
      const handleInstallClick = async () => {
          if (deferredPrompt) {
              deferredPrompt.prompt();
              const { outcome } = await deferredPrompt.userChoice;
              if (outcome === 'accepted') {
                  console.log('User accepted install');
              } else {
                  console.log('User dismissed install');
              }
              setDeferredPrompt(null);
              setShowInstallPopup(false);
          }
      };

  if (!isAuthenticated && showPopup) {
    return (
      <div className={styles.popupOverlay}>
        <div className={styles.popupContent}>
          <h2>Enter Admin Code</h2>
          <input
            type="password"
            className={styles.input}
            placeholder="Enter Code"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className={styles.submitButton} onClick={handleSubmit}>
            Submit
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
    <Head>
        <title>Admin Panel</title>
        <link rel="manifest" href="/manifest-admin.json" />
        <meta name="theme-color" content="#111827" />
      </Head>
    <div className={styles.adminLayout}>

      {/* MOBILE HEADER */}
      <div className={styles.mobileHeader}>
        <button
          className={styles.menuBtn}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          ☰
        </button>
        <span>Admin Panel</span>
      </div>

      {/* SIDEBAR */}
      <aside
        className={`${styles.sidebar} ${
          sidebarOpen ? styles.open : ''
        }`}
      >
        <h2>Welcome Admin</h2>

        <ul>
          <li
            className={activeMenu === 'products' ? styles.active : ''}
            onClick={() => {
              setActiveMenu('products');
              setSidebarOpen(false);
            }}
          >
            📦 Products
          </li>

          <li
            className={activeMenu === 'orders' ? styles.active : ''}
            onClick={() => {
              setActiveMenu('orders');
              setSidebarOpen(false);
            }}
          >
            🛒 Orders
          </li>

           <li
            className={activeMenu === 'customers' ? styles.active : ''}
            onClick={() => {
              setActiveMenu('customers');
              setSidebarOpen(false);
            }}
          >
            👨🏻‍💼 Customers
          </li>
        </ul>
      </aside>

      {/* CONTENT */}
      <main className={styles.content}>
        {activeMenu === 'products' && (
          <>
            {/* <h1>Product Management</h1>
            <p>Manage your shop products here.</p> */}
            <AdminProducts/>
          </>
        )}

        {activeMenu === 'orders' && (
          <>
            {/* <h1>Orders</h1>
            <p>View and manage orders.</p> */}
            <Orders/>
          </>
        )}

        {activeMenu === 'customers' && (
          <>
            {/* <h1>Customers</h1>
            <p>View and manage customers.</p> */}
            <Customers/>
          </>
        )}
      </main>
      {showInstallPopup && (
                <div className={styles.installPromptOverlay}>
                    <div className={styles.installPromptBox}>
                        <p>Install Admin App on your device?</p>
                        <div className={styles.buttonGroup}>
                            <button className={styles.cancelBtn} onClick={() => setShowInstallPopup(false)}>Cancel</button>
                            <button className={styles.installBtn} onClick={handleInstallClick}>Install</button>
                        </div>
                    </div>
                </div>
            )}
    </div></>
  );
}



// 'use client';

// import { useEffect, useState } from 'react';
// import CryptoJS from 'crypto-js';
// import styles from './indexadmin.module.scss';

// export default function Admin() {
//     const [isAuthenticated, setIsAuthenticated] = useState(false);
//     const [password, setPassword] = useState('');
//     const [showPopup, setShowPopup] = useState(true);

//     const SECRET_KEY = 'mySecretKey'; // Use a better secret key in production
//     const VALID_PASSWORD = '567890';

//     useEffect(() => {
//         const encryptedCode = localStorage.getItem('admin_code');
//         if (encryptedCode) {
//             const decryptedBytes = CryptoJS.AES.decrypt(encryptedCode, SECRET_KEY);
//             const decryptedCode = decryptedBytes.toString(CryptoJS.enc.Utf8);
            
//             if (decryptedCode === VALID_PASSWORD) {
//                 setIsAuthenticated(true);
//                 setShowPopup(false);
//             }
//         }
//     }, []);

//     const handleSubmit = () => {
//         if (password === VALID_PASSWORD) {
//             const encryptedCode = CryptoJS.AES.encrypt(password, SECRET_KEY).toString();
//             localStorage.setItem('admin_code', encryptedCode);

//             setIsAuthenticated(true);
//             setShowPopup(false);

//             // Auto remove after 60 minutes
//             setTimeout(() => {
//                 localStorage.removeItem('admin_code');
//                 setIsAuthenticated(false);
//                 setShowPopup(true);
//             }, 60 * 60 * 1000);
//         } else {
//             alert('Invalid Code! Try Again.');
//         }
//     };

//     if (!isAuthenticated && showPopup) {
//         return (
//             <div className={styles.popupOverlay}>
//                 <div className={styles.popupContent}>
//                     <h2>Enter Admin Code</h2>
//                     <input 
//                         type="password" 
//                         className={styles.input} 
//                         placeholder="Enter Code" 
//                         value={password} 
//                         onChange={(e) => setPassword(e.target.value)} 
//                     />
//                     <button className={styles.submitButton} onClick={handleSubmit}>Submit</button>
//                 </div>
//             </div>
//         );
//     }

//     return (
//         <>
//         <div className={styles.container}>
//             <h1 className={styles.title}>Welcome to Admin Panel</h1>
//             {/* Admin functionalities go here */}
//         </div>
//         <div className={styles.container}>
//         <button className={styles.hrefButton} onClick={() => window.location.href = '/admin/myorders'}>My Order</button>
//         <button className={styles.hrefButton} onClick={() => window.location.href = '/admin/shopproduct'}>Shop Product</button>
//             {/* <button className={styles.hrefButton} onClick={() => window.location.href = '/admin/icproduct'}>Common Product</button> */}
//         {/* Admin functionalities go here */}
//     </div></>
//     );
// }
