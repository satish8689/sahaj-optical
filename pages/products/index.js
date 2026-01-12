'use client';

import React, { useEffect, useState } from 'react';
import { FaHeart, FaShoppingCart } from 'react-icons/fa';
import styles from './products.module.scss';
import OrderSummary from '../order-summary/index.js';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

export default function ProductList() {
    const router = useRouter();
    const [products, setProducts] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [search, setSearch] = useState('');
    const [priceRange, setPriceRange] = useState('');
    const [icProducts, setIcProducts] = useState([]);
    const [showOrderSummary, setShowOrderSummary] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showPopup, setShowPopup] = useState(false);
    const [userName, setUserName] = useState('');
    const [userMobile, setUserMobile] = useState('');
    const [userAddress, setUserAddress] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [wishlist, setWishlist] = useState([]);

    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showInstallPopup, setShowInstallPopup] = useState(false);
    const [current, setCurrent] = React.useState(0);

    const images = [
        "/slider/img1.webp",
        "/slider/img2.jpg",
        "/slider/img3.jpg",
    ];

    React.useEffect(() => {
        const interval = setInterval(() => {
            setCurrent((prev) => (prev + 1) % images.length);
        }, 6000);

        return () => clearInterval(interval);
    }, []);

    // const handleInstallClick = async () => {
    //     if (deferredPrompt) {
    //         deferredPrompt.prompt();
    //         const { outcome } = await deferredPrompt.userChoice;
    //         if (outcome === 'accepted') {
    //             console.log('✅ App added to home screen');
    //         } else {
    //             console.log('🚫 User dismissed install prompt');
    //         }
    //         setDeferredPrompt(null);
    //         setShowInstallPopup(false);
    //     }
    // };

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

    useEffect(() => {
        const storedUser = localStorage.getItem('userInfo');
        if (!storedUser) {
            setShowPopup(true);
        } else {
            const userData = JSON.parse(storedUser);
            setUserName(userData.name);
            setUserMobile(userData.mobile);
            setUserAddress(userData.address);
        }
        getProducts();
    }, []);

    async function getProducts() {
        let apiresult = await fetch('/api/products');
        let { data } = await apiresult.json();
        console.log("data", data)
        if (data.length > 0) {
            let productObj = data.map(iterator => ({ ...iterator }));
            setProducts(productObj);
        }
        setIsLoading(false);
    }

    const handleToggleWishlist = (productId) => {
        setWishlist(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
        toast.success("Wishlist updated!", { position: "top-center", autoClose: 3000 });
    };

    useEffect(() => {
        document.body.style.overflow = selectedProduct ? 'hidden' : '';
    }, [selectedProduct]);

    useEffect(() => {
        // Load from localStorage once on mount
        const orderData = localStorage.getItem('orderInfo');
        if (orderData) {
            try {
                const parsedData = JSON.parse(orderData);
                if (Array.isArray(parsedData) && parsedData.length > 0) {
                    setSelectedProducts(parsedData);
                }
            } catch (error) {
                console.error("Failed to parse orderInfo from localStorage:", error);
            }
        }
    }, []); // <- empty dependency array, runs only once on mount

    useEffect(() => {
        if (selectedProducts?.length > 0) {
            localStorage.setItem('orderInfo', JSON.stringify(selectedProducts));
        }
    }, [selectedProducts]);

    const handleAddToCart = (productId, quantity) => {
        let selectPro = products.find(p => p.id === productId);
        if (!selectPro) return;

        let numericQuantity = parseFloat(quantity);
        let totalPrice = numericQuantity * selectPro.price;

        setSelectedProducts(prev => {
            let updatedProducts = prev?.map(p =>
                p.title === selectPro.productTitle
                    ? { ...p, quantity, proTotalPrice: totalPrice }
                    : p
            );

            if (!quantity) {
                updatedProducts = updatedProducts.filter(p => p.title !== selectPro.productTitle);
            } else if (!prev?.some(p => p.title === selectPro.productTitle)) {
                updatedProducts?.push({
                    id: selectPro.id,
                    title: selectPro.productTitle,
                    productImage: selectPro.productImage,
                    price: selectPro.price,
                    type: selectPro.type,
                    quantity,
                    proTotalPrice: totalPrice
                });
            }

            return updatedProducts;
        });

        toast.success("Product added!", { position: "top-center", autoClose: 3000, className: 'customSuccessToast' });
    };
    const handleOrder = () => {
        router.push('/order-summary');
    };
    const handleGoBack = () => setShowOrderSummary(false);

    const handlePopupSubmit = async () => {
        if (!userName.trim() || !userMobile.trim()) {
            alert("Please enter valid Name and Mobile Number");
            return;
        }

        if (!/^\d{10}$/.test(userMobile)) {
            alert("Please enter a valid 10-digit mobile number.");
            return;
        }
        const method = 'POST';
        const url = '/api/users';
        const payload = { name: userName, mobile: userMobile, address: userAddress }
        fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        localStorage.setItem('userInfo', JSON.stringify({ name: userName, mobile: userMobile, address: userAddress }));
        setShowPopup(false);
    };

    const handleUserProfile = () => {
        setShowPopup(true);
    };

    const filteredProducts = products.filter(product => {
        const matchesSearch = !search || (product.productTitle && product.productTitle.toLowerCase().includes(search.toLowerCase()));

        let matchesPrice = true;
        const price = parseFloat(product.price);
        if (priceRange === 'below500') matchesPrice = price < 500;
        else if (priceRange === '500to1000') matchesPrice = price >= 500 && price <= 1000;
        else if (priceRange === 'above1000') matchesPrice = price > 1000;

        return matchesSearch && matchesPrice;
    });

    // if (showOrderSummary) {
    //     return (
    //         <OrderSummary
    //             selectedProducts={selectedProducts}
    //             setSelectedProducts={setSelectedProducts}
    //             goBack={handleGoBack}
    //         />
    //     );
    // }

    return (
        <>
            <div className={styles.filterBar}>

                <img
                           src={"./logo.png"}
                            
                            className={styles.logoHeader}
                        />
                <input
                    type="text"
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={styles.searchBox}
                />

                <select
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value)}
                    className={styles.priceFilterDropdown}
                >
                    <option value="">All</option>
                    <option value="below500">Below ₹500</option>
                    <option value="500to1000">₹500 - ₹1000</option>
                    <option value="above1000">Above ₹1000</option>
                </select>
            </div>
            <div className={styles.header}>
                {/* <div className={styles.shopName}>Aaradhya Stationery</div> */}

                {/* Auto Slider */}
                <div className={styles.slider}>
                    {images.map((img, index) => (
                        <img
                            key={index}
                            src={img}
                            alt="banner"
                            className={`${styles.slide} ${index === current ? styles.active : ""
                                }`}
                        />
                    ))}

                    {/* Shop Name Overlay */}
                    <div className={styles.shopNameOverlay}>
                        SAHAJ OPTICAL
                    </div>
                </div>

                {/* Search & Filter */}

            </div>


            <div className={styles.container}>
                {showPopup && (
                    <div className={styles.popup}>
                        <div className={styles.popupContent}>
                            <h2>Enter Your Details</h2>
                            <input
                                type="text"
                                placeholder="Enter Name"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                className={styles.input}
                            />
                            <input
                                type="tel"
                                placeholder="Enter Whatsapp Number"
                                value={userMobile}
                                onChange={(e) => setUserMobile(e.target.value)}
                                className={styles.input}
                            />
                            <input
                                type="text"
                                placeholder="Enter Address"
                                value={userAddress}
                                onChange={(e) => setUserAddress(e.target.value)}
                                className={styles.input}
                            />
                            <button onClick={handlePopupSubmit} className={styles.submitButton}>Submit</button>
                        </div>
                    </div>
                )}

                {isLoading ? (
                    <div className={styles.loadercontainer}><div className={styles.loader}></div></div>
                ) : (
                    <div className={styles.productList}>
                        {filteredProducts.length > 0 ? (
                            filteredProducts.map((product) => (
                                <div key={product.id} className={styles.productCard} onClick={() => setSelectedProduct(product)}>
                                    <div className={styles.wishlistIcon} onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleWishlist(product.id);
                                    }}>
                                        <img
                                            src={wishlist.includes(product.id) ? 'icon/redheart.png' : 'icon/blackheart.png'}
                                            alt="Wishlist"
                                            className={styles.wishlistIconImg}
                                        />
                                    </div>
                                    <img
                                        src={product.productImage}
                                        alt={product.productTitle}
                                        className={styles.productImage}
                                    />
                                    <div className={styles.productDetails}>
                                        <div className={styles.actions}>
                                            <span className={styles.productTitle}>{product.productTitle}</span>
                                        </div>
                                    </div>
                                    <div className={styles.priceRow}>
                                        <span className={styles.productPrice}>₹{product.price}</span>
                                        <span className={styles.originalPrice}>₹{product.originalPrice}</span>
                                        {product.originalPrice > product.price && (
                                            <span className={styles.discount}>
                                                {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                                            </span>
                                        )}
                                    </div>
                                    <div className={styles.reviewRow}>
                                        <span className={styles.rating}>{product.rating}</span>
                                        <span className={styles.star}>★</span>
                                        <span className={styles.reviewCount}>({product.reviewCount} Reviews)</span>
                                    </div>
                                    {selectedProducts?.some(p => p.id === product.id) ? (
                                        <div className={styles.qtyButtons}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const existing = selectedProducts.find(p => p.id === product.id);
                                                    if (existing.quantity > 1) {
                                                        handleAddToCart(product.id, existing.quantity - 1);
                                                    } else {
                                                        handleAddToCart(product.id, '');
                                                    }
                                                }}
                                            >
                                                −
                                            </button>
                                            <span>
                                                {selectedProducts.find(p => p.id === product.id)?.quantity}
                                            </span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const existing = selectedProducts.find(p => p.id === product.id);
                                                    handleAddToCart(product.id, Number(existing.quantity) + 1);
                                                }}
                                            >
                                                +
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            className={styles.addToCard}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleAddToCart(product.id, 1);
                                            }}
                                        >
                                            Add To Cart
                                        </button>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p>No products available</p>
                        )}
                    </div>
                )}
                <br />
                <br />
                <div className={styles.bottomBarRow}>
                    <button onClick={handleUserProfile} className={styles.userProfileButton}>User Profile</button>
                    <button onClick={handleOrder} className={styles.orderButton}>Order Summary</button>
                </div>
            </div>

            {selectedProduct && (
                <div className={styles.modalOverlay} onClick={() => setSelectedProduct(null)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setSelectedProduct(null)} className={styles.closeBtn}>×</button>
                        <div className={styles.modalContentWithButton}>

                            <img
                                src={selectedProduct.productImage}
                                className={styles.productImageDetails}
                                alt={selectedProduct.productTitle}
                            />
                            <div className={styles.modalHeader}>
                                <h2 className={styles.productTitleDetails}>{selectedProduct.productTitle}</h2>
                                <div className={styles.wishlisDetailstIcon} onClick={() => handleToggleWishlist(selectedProduct.id)}>
                                    <img
                                        src={wishlist.includes(selectedProduct.id) ? 'icon/redheart.png' : 'icon/blackheart.png'}
                                        alt="Wishlist"
                                        className={styles.wishlistIconImg}
                                    />
                                </div>
                            </div>
                            <div className={styles.priceRowDetails}>
                                <span className={styles.productPrice}>₹{selectedProduct.price}</span>
                                <span className={styles.originalPrice}>₹{selectedProduct.originalPrice}</span>
                                {selectedProduct.originalPrice > selectedProduct.price && (
                                    <span className={styles.discount}>
                                        {Math.round(((selectedProduct.originalPrice - selectedProduct.price) / selectedProduct.originalPrice) * 100)}% OFF
                                    </span>
                                )}
                            </div>
                            <div className={styles.reviewRowDetails}>
                                <span className={styles.ratingDetails}>{selectedProduct.rating}</span>
                                <span className={styles.starDetails}>★</span>
                                <span className={styles.reviewCountDetails}>({selectedProduct.reviewCount} Reviews)</span>
                            </div>
                            <p><strong>Note:</strong> {selectedProduct.note}</p>
                            <p><strong>Description:</strong> {selectedProduct.description}</p>
                            {/* <button type="button" className={styles.addToCardDetails}>Add To Card</button> */}

                            {selectedProducts?.some(p => p.id === selectedProduct.id) ? (
                                <div className={styles.qtyButtonsDetails}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const existing = selectedProducts.find(p => p.id === selectedProduct.id);
                                            if (existing.quantity > 1) {
                                                handleAddToCart(selectedProduct.id, existing.quantity - 1);
                                            } else {
                                                handleAddToCart(selectedProduct.id, '');
                                            }
                                        }}
                                    >
                                        −
                                    </button>
                                    <span>
                                        {selectedProducts.find(p => p.id === selectedProduct.id)?.quantity}
                                    </span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const existing = selectedProducts.find(p => p.id === selectedProduct.id);
                                            handleAddToCart(selectedProduct.id, Number(existing.quantity) + 1);
                                        }}
                                    >
                                        +
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    className={styles.addToCardDetails}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleAddToCart(selectedProduct.id, 1);
                                    }}
                                >
                                    Add To Cart
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showInstallPopup && (
                <div className={styles.installPromptOverlay}>
                    <div className={styles.installPromptBox}>
                        <p>Add this app to your home screen?</p>
                        <div className={styles.buttonGroup}>
                            <button className={styles.cancelBtn} onClick={() => setShowInstallPopup(false)}>Cancel</button>
                            <button className={styles.installBtn} onClick={handleInstallClick}>Install</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
