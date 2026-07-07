#!/bin/bash

echo "🚀 Creating all project files and folders..."

# Create pages
echo "📄 Creating pages..."
touch frontend/src/pages/{HomePage.jsx,ShopPage.jsx,ProductPage.jsx,CartPage.jsx,CheckoutPage.jsx,AboutPage.jsx,ContactPage.jsx,NotFound.jsx}
touch frontend/src/pages/auth/{LoginPage.jsx,RegisterPage.jsx,ForgotPasswordPage.jsx,ResetPasswordPage.jsx}
touch frontend/src/pages/user/{ProfilePage.jsx,OrderHistoryPage.jsx,OrderDetailsPage.jsx,WishlistPage.jsx}
touch frontend/src/pages/admin/{DashboardPage.jsx,ProductsPage.jsx,OrdersPage.jsx,UsersPage.jsx,AnalyticsPage.jsx,SettingsPage.jsx}

# Create store files
echo "📦 Creating store files..."
touch frontend/src/store/index.js
touch frontend/src/store/slices/{authSlice.js,cartSlice.js,productSlice.js,orderSlice.js,adminSlice.js,uiSlice.js}
touch frontend/src/store/api/{productApi.js,orderApi.js,userApi.js,adminApi.js}
touch frontend/src/store/thunks/{authThunks.js,cartThunks.js,orderThunks.js}

# Create services
echo "🔧 Creating services..."
touch frontend/src/services/api/{axiosConfig.js,authService.js,productService.js,orderService.js,paymentService.js}
touch frontend/src/services/websocket/socket.js

# Create utils
echo "🛠️ Creating utils..."
touch frontend/src/utils/validators/{authValidator.js,orderValidator.js}
touch frontend/src/utils/helpers/{priceHelper.js,dateHelper.js,stringHelper.js,arrayHelper.js}
touch frontend/src/utils/formatters/{currency.js,date.js,number.js}
touch frontend/src/utils/constants/{apiEndpoints.js,routes.js,config.js}

# Create config files
echo "⚙️ Creating config files..."
touch frontend/src/config/routes.js
touch frontend/src/config/axios.js
touch frontend/src/App.jsx
touch frontend/src/main.jsx
touch frontend/.env frontend/.env.example frontend/.gitignore frontend/package.json
touch frontend/vite.config.js frontend/tailwind.config.js frontend/postcss.config.js frontend/index.html

# Create project root files
echo "📁 Creating root files..."
touch README.md docker-compose.yml .gitignore .prettierrc .eslintrc.json
touch docker-compose.dev.yml Dockerfile.backend Dockerfile.frontend nginx.conf

# Create seed and test directories
echo "🧪 Creating seed and test files..."
mkdir -p backend/seed
touch backend/seed/products.js backend/seed/users.js backend/seed/categories.js
mkdir -p backend/tests/{unit,integration,performance}
touch backend/tests/unit/{auth.test.js,product.test.js}
touch backend/tests/integration/{api.test.js,db.test.js}
touch backend/tests/performance/{load.test.js,stress.test.js}
touch backend/jest.config.js

mkdir -p frontend/tests/{unit,e2e}
touch frontend/tests/unit/{components.test.js,utils.test.js}
touch frontend/tests/e2e/{app.spec.js,checkout.spec.js}
touch frontend/vitest.config.js

echo "✅ All files and folders created successfully!"
echo ""
echo "📂 Folder structure created:"
echo "  - frontend/src/pages/"
echo "  - frontend/src/store/"
echo "  - frontend/src/services/"
echo "  - frontend/src/utils/"
echo "  - frontend/src/config/"
echo "  - backend/seed/"
echo "  - backend/tests/"
echo "  - frontend/tests/"
