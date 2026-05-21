import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { RequireAdmin } from '@/components/RequireAdmin'

const HomePage = lazy(() =>
  import('@/pages/HomePage').then((m) => ({ default: m.HomePage })),
)
const SignupPage = lazy(() =>
  import('@/pages/SignupPage').then((m) => ({ default: m.SignupPage })),
)
const LoginPage = lazy(() =>
  import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })),
)
const AdminPage = lazy(() =>
  import('@/pages/admin/AdminPage').then((m) => ({ default: m.AdminPage })),
)
const AdminProductsPage = lazy(() =>
  import('@/pages/admin/AdminProductsPage').then((m) => ({
    default: m.AdminProductsPage,
  })),
)
const AdminOrdersPage = lazy(() =>
  import('@/pages/admin/AdminOrdersPage').then((m) => ({
    default: m.AdminOrdersPage,
  })),
)
const AdminOrderDetailPage = lazy(() =>
  import('@/pages/admin/AdminOrderDetailPage').then((m) => ({
    default: m.AdminOrderDetailPage,
  })),
)
const ProductCreatePage = lazy(() =>
  import('@/pages/admin/ProductCreatePage').then((m) => ({
    default: m.ProductCreatePage,
  })),
)
const ProductDetailPage = lazy(() =>
  import('@/pages/ProductDetailPage').then((m) => ({
    default: m.ProductDetailPage,
  })),
)
const CartPage = lazy(() =>
  import('@/pages/CartPage').then((m) => ({ default: m.CartPage })),
)
const CheckoutPage = lazy(() =>
  import('@/pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })),
)
const CheckoutCompletePage = lazy(() =>
  import('@/pages/CheckoutCompletePage').then((m) => ({
    default: m.CheckoutCompletePage,
  })),
)
const OrdersPage = lazy(() =>
  import('@/pages/OrdersPage').then((m) => ({ default: m.OrdersPage })),
)
const OrderCompletePage = lazy(() =>
  import('@/pages/OrderCompletePage').then((m) => ({
    default: m.OrderCompletePage,
  })),
)

export function AppRoutes() {
  return (
    <Suspense fallback={<p className="app-routes-fallback">로딩 중…</p>}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/checkout/complete" element={<CheckoutCompletePage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:id" element={<OrderCompletePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<AdminPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="orders/:id" element={<AdminOrderDetailPage />} />
        </Route>
        <Route
          path="/admin/products/new"
          element={
            <RequireAdmin>
              <ProductCreatePage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/products/:id/edit"
          element={
            <RequireAdmin>
              <ProductCreatePage />
            </RequireAdmin>
          }
        />
      </Routes>
    </Suspense>
  )
}
