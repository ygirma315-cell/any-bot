'use client';

import React, { useState, useEffect } from 'react';
import { Product } from '@/config/products';
import { RgbAtmosphere } from '@/components/RgbAtmosphere';
import { Header } from '@/components/Header';
import { Navbar } from '@/components/Navbar';
import { ProductGrid } from '@/components/ProductGrid';
import { OrderScreen } from '@/components/OrderScreen';
import { PaymentScreen } from '@/components/PaymentScreen';
import { StatusScreen } from '@/components/StatusScreen';
import { LoadingScreen } from '@/components/LoadingScreen';
import { ContactModal } from '@/components/ContactModal';
import { getTelegramWebApp, getTelegramUser } from '@/lib/telegram';
import { recordVisitor } from '@/lib/store';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'services' | 'order' | 'payment' | 'status'>('services');
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [userEmail, setUserEmail] = useState<string>('');
  const [isContactModalOpen, setIsContactModalOpen] = useState<boolean>(false);
  const mainRef = React.useRef<HTMLElement>(null);

  const scrollToTop = () => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleTabChange = (tab: 'services' | 'order' | 'payment' | 'status') => {
    setActiveTab(tab);
    scrollToTop();
  };

  useEffect(() => {
    const webApp = getTelegramWebApp();
    if (webApp) {
      webApp.ready();
      webApp.expand();
    }
    const { user } = getTelegramUser();
    if (user) {
      recordVisitor(user);
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
    // Auto-navigate user directly to Order page on Add & scroll to top
    handleTabChange('order');
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
      {/* Animated Brand Loading Screen Splash */}
      <LoadingScreen />

      {/* Interactive Contact & Support Modal */}
      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />

      {/* Dynamic Ambient RGB Lighting System */}
      <RgbAtmosphere activeTab={activeTab === 'status' ? 'services' : activeTab} />

      {/* Main App Container Shell */}
      <div className="relative z-10 flex flex-col h-full w-full overflow-hidden">
        {/* Fixed Top Header (Never Scrolls) */}
        <Header onOpenContact={() => setIsContactModalOpen(true)} />

        {/* Scrollable Middle Content Body */}
        <main ref={mainRef} className="flex-1 overflow-y-auto custom-scrollbar touch-pan-y overscroll-contain style-touch-scroll">
          {activeTab === 'services' && (
            <ProductGrid cart={cart} onAddToCart={handleAddToCart} />
          )}

          {activeTab === 'order' && (
            <OrderScreen
              cart={cart}
              userEmail={userEmail}
              setUserEmail={setUserEmail}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onProceedToPayment={() => handleTabChange('payment')}
              onBrowseServices={() => handleTabChange('services')}
            />
          )}

          {activeTab === 'payment' && (
            <PaymentScreen
              cart={cart}
              userEmail={userEmail}
              onOrderCompleted={() => setCart([])}
              onBrowseServices={() => handleTabChange('services')}
              onViewStatus={() => handleTabChange('status')}
            />
          )}

          {activeTab === 'status' && (
            <StatusScreen onBrowseServices={() => handleTabChange('services')} />
          )}
        </main>

        {/* Fixed Bottom Navigation (Never Scrolls) */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          cartCount={totalCartCount}
          onNavSpaceClick={scrollToTop}
        />
      </div>
    </div>
  );
}
