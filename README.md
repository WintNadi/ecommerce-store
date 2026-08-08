# 🛍️ E-Commerce Store

A modern, full-featured **MERN Stack E-Commerce Platform** built with **MongoDB, Express.js, React, and Node.js**. The application supports role-based authentication, online shopping, seller management, real-time order updates, and secure payment integration with a responsive and user-friendly interface.

<p align="center">
  <img src="https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb">
  <img src="https://img.shields.io/badge/Express.js-Backend-000000?style=for-the-badge&logo=express">
  <img src="https://img.shields.io/badge/React-Frontend-61DAFB?style=for-the-badge&logo=react">
  <img src="https://img.shields.io/badge/Node.js-Runtime-339933?style=for-the-badge&logo=node.js">
  <img src="https://img.shields.io/badge/Tailwind_CSS-Styling-38BDF8?style=for-the-badge&logo=tailwindcss">
  <img src="https://img.shields.io/badge/Redux_Toolkit-State_Management-764ABC?style=for-the-badge&logo=redux">
  <img src="https://img.shields.io/badge/Socket.io-Real_Time-010101?style=for-the-badge&logo=socket.io">
</p>

---

# 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [System Architecture](#-system-architecture)
- [Project Structure](#-project-structure)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Application Workflow](#-application-workflow)
- [API Documentation](#-api-documentation)
- [Future Improvements](#-future-improvements)
- [Contributing](#-contributing)
- [Author](#-author)

---

# 🛒 Overview

The **E-Commerce Store** is a complete online shopping platform that enables customers to browse products, manage carts, place orders, and track deliveries. Sellers can manage products and inventory, while administrators oversee users, products, and orders through dedicated dashboards.

---

# ✨ Features

## 🔐 Authentication & Authorization

- JWT Authentication
- User Registration & Login
- Secure Logout
- Email Verification
- Password Reset
- Remember Me
- Role-Based Access Control
  - User
  - Seller
  - Admin

---

## 👤 Customer Features

- Browse products
- Product search
- Category filtering
- Price filtering
- Shopping cart
- Wishlist
- Checkout
- Order history
- Order tracking
- Multiple shipping addresses
- Profile management

---

## 🏪 Seller Features

- Seller dashboard
- Product CRUD
- Inventory management
- Order management
- Sales statistics
- Product analytics

---

## 👑 Admin Features

- Admin dashboard
- User management
- Product management
- Seller management
- Order management
- Sales reports
- CSV export

---

## 🎨 User Experience

- Responsive design
- Dark mode
- Mood-based themes
- Smart product search
- Loading animations
- Toast notifications
- Pagination
- Skeleton loading
- Real-time updates with Socket.io

---

## 💳 Payment

Supported integrations:

- Stripe
- Credit Card
- Debit Card
- Digital Wallets

> Additional payment gateways can be added easily.

---

# 🛠 Technology Stack

| Category | Technology |
|-----------|------------|
| Frontend | React |
| Routing | React Router |
| State Management | Redux Toolkit |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Backend | Node.js |
| Framework | Express.js |
| Database | MongoDB |
| ODM | Mongoose |
| Authentication | JWT |
| Real-time | Socket.io |
| Payment | Stripe |

---

# 🏗 System Architecture

```
React Frontend
      │
      ▼
 REST API + Socket.io
      │
      ▼
Express.js Server
      │
      ▼
 MongoDB Database
```

---

# 📁 Project Structure

```text
ecommerce-store/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── models/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── services/
│   │   ├── utils/
│   │   └── sockets/
│   │
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── store/
│   │   ├── utils/
│   │   └── styles/
│   │
│   ├── .env.example
│   └── package.json
│
├── .gitignore
└── README.md
```

---

# 🚀 Installation

## Prerequisites

- Node.js 18+
- MongoDB Atlas or Local MongoDB
- npm or yarn

---

## Clone Repository

```bash
git clone https://github.com/yourusername/ecommerce-store.git

cd ecommerce-store
```

---

## Install Backend

```bash
cd backend

npm install
```

---

## Install Frontend

```bash
cd frontend

npm install
```

---

# ⚙ Environment Variables

## Backend `.env`

```env
PORT=5000

NODE_ENV=development

MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database

JWT_SECRET=your_jwt_secret

JWT_REFRESH_SECRET=your_refresh_secret

CLIENT_URL=http://localhost:5173

STRIPE_SECRET_KEY=your_stripe_secret_key
```

---

## Frontend `.env`

```env
VITE_API_URL=http://localhost:5000/api

VITE_STRIPE_PUBLIC_KEY=your_public_key
```

---

# ▶ Running the Application

## Backend

```bash
cd backend

npm run dev
```

---

## Frontend

```bash
cd frontend

npm run dev
```

---

Application URLs

Frontend

```
http://localhost:5173
```

Backend API

```
http://localhost:5000/api
```

---

# 🔄 Application Workflow

```
User Login
     │
     ▼
Browse Products
     │
     ▼
Add to Cart
     │
     ▼
Checkout
     │
     ▼
Online Payment
     │
     ▼
Order Created
     │
     ▼
Seller Processes Order
     │
     ▼
Customer Tracks Delivery
```

---

# 📚 API Documentation

## Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Current user |
| PUT | `/api/auth/profile` | Update profile |

---

## Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Get all products |
| GET | `/api/products/:id` | Product details |
| POST | `/api/products` | Create product |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |

---

## Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | Create order |
| GET | `/api/orders/my-orders` | User orders |
| GET | `/api/orders/:id` | Order details |
| PUT | `/api/orders/:id/status` | Update order |

---

## Cart

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cart` | Get cart |
| POST | `/api/cart` | Add item |
| PUT | `/api/cart/:id` | Update quantity |
| DELETE | `/api/cart/:id` | Remove item |

---

# 📸 Screenshots

> Add screenshots after implementation.

| Page | Preview |
|------|---------|
| Home Page | Coming Soon |
| Product Details | Coming Soon |
| Shopping Cart | Coming Soon |
| Checkout | Coming Soon |
| Seller Dashboard | Coming Soon |
| Admin Dashboard | Coming Soon |

---

# 🚀 Future Improvements

- ⭐ Product Reviews & Ratings
- 🎟 Coupon & Discount System
- 📧 Email Notifications
- 🤖 AI Product Recommendations
- 📱 React Native Mobile App
- ❤️ Product Comparison
- 💬 Live Customer Support
- 📊 Advanced Sales Analytics

---

# 🤝 Contributing

Contributions are welcome.

1. Fork the repository
2. Create a new branch

```bash
git checkout -b feature/AmazingFeature
```

3. Commit your changes

```bash
git commit -m "Add AmazingFeature"
```

4. Push to GitHub

```bash
git push origin feature/AmazingFeature
```

5. Open a Pull Request

---


# 👨‍💻 Author

**Your Name**

- GitHub: https://github.com/WintNadi

---

# 🙏 Acknowledgements

Special thanks to:

- React
- Node.js
- Express.js
- MongoDB
- Tailwind CSS
- Stripe
- Socket.io
- Open Source Community

---

<div align="center">

### ⭐ If you found this project helpful, consider giving it a star!

**Built with ❤️ using the MERN Stack**

</div>