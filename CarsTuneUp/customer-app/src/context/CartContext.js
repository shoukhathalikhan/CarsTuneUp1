import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);

  const addToCart = (service, selectedAddOns = {}) => {
    const addOnsArray = [
      { id: 'microfiber', name: 'Micro Fiber Cloth', price: 100 },
      { id: 'engine', name: 'Engine Bay Cleaning', price: 100 },
      { id: 'alloy', name: 'Alloy Wheels Cleaning', price: 100 },
      { id: 'logo', name: 'Logo Cleaning', price: 100 }
    ].filter(addon => selectedAddOns[addon.id]);

    const basePrice = Number(service.price) || 0;
    const addOnsTotal = addOnsArray.reduce((sum, addon) => sum + addon.price, 0);
    const totalAmount = basePrice + addOnsTotal;

    const cartItem = {
      id: `${service._id}-${Date.now()}`,
      serviceId: service._id,
      serviceName: service.name,
      baseServicePrice: basePrice,
      selectedAddOns: addOnsArray,
      addOnsTotal,
      totalAmount,
      vehicleType: service.vehicleType || 'Hatchback',
      duration: service.duration,
      frequency: service.frequency,
      category: service.category,
      description: service.description,
      imageURL: service.imageURL
    };

    setCartItems([cartItem]);
    setCurrentOrder(cartItem);
  };

  const removeFromCart = (cartItemId) => {
    setCartItems(cartItems.filter(item => item.id !== cartItemId));
    if (currentOrder?.id === cartItemId) {
      setCurrentOrder(null);
    }
  };

  const clearCart = () => {
    setCartItems([]);
    setCurrentOrder(null);
  };

  const getCartTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.totalAmount, 0);
  };

  const getCartSummary = () => {
    if (cartItems.length === 0) {
      return {
        itemCount: 0,
        baseTotal: 0,
        addOnsTotal: 0,
        totalAmount: 0
      };
    }

    const baseTotal = cartItems.reduce((sum, item) => sum + item.baseServicePrice, 0);
    const addOnsTotal = cartItems.reduce((sum, item) => sum + item.addOnsTotal, 0);
    const totalAmount = baseTotal + addOnsTotal;

    return {
      itemCount: cartItems.length,
      baseTotal,
      addOnsTotal,
      totalAmount
    };
  };

  const value = {
    cartItems,
    currentOrder,
    addToCart,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartSummary,
    setCurrentOrder
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
