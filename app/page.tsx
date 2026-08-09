'use client';

import React, { useState, useEffect } from 'react';
import { Product } from '@/config/products';
import { RgbAtmosphere } from '@/components/RgbAtmosphere';
import { Header } from '@/components/Header';
import { Navbar } from '@/components/Navbar';
import { ProductGrid } from '@/components/ProductGrid';
import { OrderScreen } from '@/components/OrderScreen';
import { PaymentScreen } from '@/components/PaymentScreen';
import { getTelegramWebApp } from '@/lib/telegram';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'services' | 'order' | 'payment'>('services');
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);

  useEffect(() => {
    const webApp = getTelegramWebApp();
    if (webApp) {
      webApp.ready();
      webApp.expand();
    }
  }, []);

  const handleAddToCart = (product: Product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
    // Auto-navigate user directly to Order page on Add
    setActiveTab('order');
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as { product: Product; quantity: number }[];
    });
  };

  const handleRemoveItem = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="app-viewport flex flex-col h-screen overflow-hidden">
      {/* Dynamic Ambient RGB Lighting System */}
      <RgbAtmosphere activeTab={activeTab} />

      {/* Main App Container Shell */}
      <div className="relative z-10 flex flex-col h-full w-full overflow-hidden">
        {/* Fixed Top Header (Never Scrolls) */}
        <Header />

        {/* Scrollable Middle Content Body */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {activeTab === 'services' && (
            <ProductGrid cart={cart} onAddToCart={handleAddToCart} />
          )}

          {activeTab === 'order' && (
            <OrderScreen
              cart={cart}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onProceedToPayment={() => setActiveTab('payment')}
              onBrowseServices={() => setActiveTab('services')}
            />
          )}

          {activeTab === 'payment' && (
            <PaymentScreen
              cart={cart}
              onOrderCompleted={() => setCart([])}
              onBrowseServices={() => setActiveTab('services')}
            />
          )}
        </main>

        {/* Fixed Bottom Navigation (Never Scrolls) */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          cartCount={totalCartCount}
        />
      </div>
    </div>
  );
}
