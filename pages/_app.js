import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import "./styles/globals.css"

// Dynamically switch favicon based on route
function FaviconSwitcher() {
  const pathname = usePathname();

  useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('/sw.js')
                .then(reg => console.log('✅ Service Worker registered:', reg.scope))
                .catch(err => console.log('❌ Service Worker registration failed:', err));
        }
    }, []);

  useEffect(() => {
    const favicon = document.querySelector("link[rel~='icon']");

    if (!favicon) return;

    if (pathname.startsWith('/admin')) {
      favicon.href = '/favicon-admin.png'; // Make sure this exists in /public
    } else {
      favicon.href = '/favicon.png';
    }
  }, [pathname]);

  return null;
}

export default function App({ Component, pageProps }) {
  return (
    <>
      <FaviconSwitcher />
      <Component {...pageProps} />
      <ToastContainer position="top-right" autoClose={2000} />
    </>
  );
}
