'use client';
import { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useRouter } from 'next/navigation';
export default function Home() {
    const [productss, setProductss] = useState([]);
     const router = useRouter();
    useEffect(() => {
        router.push('/products');
    }, []);
    return (
        <div>
            <ToastContainer position="top-right" autoClose={2000} />
            <h1>Comming Soon</h1>
            {/* <ul>{productss.map(products => <li key={products.id}>{products.title}</li>)}</ul> */}
        </div>
    );
}