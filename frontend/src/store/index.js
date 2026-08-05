import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import cartReducer from './slices/cartSlice';
import productReducer from './slices/productSlice';
import orderReducer from './slices/orderSlice';
import adminReducer from './slices/adminSlice';
import searchReducer from './slices/searchSlice';  // ← ဒါပါရမယ်
import themeReducer from './slices/themeSlice';
import wishlistReducer from './slices/wishlistSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    products: productReducer,
    orders: orderReducer,
    admin: adminReducer,
    search: searchReducer,
    theme: themeReducer,
    wishlist: wishlistReducer,
  },
});

export default store;