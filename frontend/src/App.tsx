import { RouterProvider, createRouter, createRoute, createRootRoute } from '@tanstack/react-router';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { AdminAuthProvider } from './hooks/useAdminAuth';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import MyOrdersPage from './pages/MyOrdersPage';
import GalleryPage from './pages/GalleryPage';
import PortfolioPage from './pages/PortfolioPage';
import BlogPage from './pages/BlogPage';
import BlogDetailPage from './pages/BlogDetailPage';
import ForumPage from './pages/ForumPage';
import ForumThreadPage from './pages/ForumThreadPage';
import AboutPage from './pages/AboutPage';
import FAQPage from './pages/FAQPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminProductsPage from './pages/AdminProductsPage';
import AdminOrdersPage from './pages/AdminOrdersPage';
import AdminMessagesPage from './pages/AdminMessagesPage';
import AdminGalleryPage from './pages/AdminGalleryPage';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage';
import AdminPortfolioPage from './pages/AdminPortfolioPage';
import AdminGalleryManagementPage from './pages/AdminGalleryManagementPage';
import AdminBlogPage from './pages/AdminBlogPage';

const rootRoute = createRootRoute({
  component: Layout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
});

const productsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/products',
  component: ProductsPage,
});

const productDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/products/$id',
  component: ProductDetailPage,
});

const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cart',
  component: CartPage,
});

const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/checkout',
  component: CheckoutPage,
});

const orderSuccessRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/order-success',
  component: OrderSuccessPage,
});

const myOrdersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/my-orders',
  component: MyOrdersPage,
});

const galleryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/gallery',
  component: GalleryPage,
});

const portfolioRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/portfolio',
  component: PortfolioPage,
});

const blogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/blog',
  component: BlogPage,
});

const blogDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/blog/$id',
  component: BlogDetailPage,
});

const forumRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/forum',
  component: ForumPage,
});

const forumThreadRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/forum/$postId',
  component: ForumThreadPage,
});

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/about',
  component: AboutPage,
});

const faqRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/faq',
  component: FAQPage,
});

const adminDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin-dashboard',
  component: AdminDashboardPage,
});

const adminProductsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/products',
  component: AdminProductsPage,
});

const adminOrdersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/orders',
  component: AdminOrdersPage,
});

const adminMessagesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/messages',
  component: AdminMessagesPage,
});

const adminGalleryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/gallery',
  component: AdminGalleryPage,
});

const adminAnalyticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/analytics',
  component: AdminAnalyticsPage,
});

const adminPortfolioRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/portfolio',
  component: AdminPortfolioPage,
});

const adminGalleryContentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/gallery-content',
  component: AdminGalleryManagementPage,
});

const adminBlogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/blog',
  component: AdminBlogPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  productsRoute,
  productDetailRoute,
  cartRoute,
  checkoutRoute,
  orderSuccessRoute,
  myOrdersRoute,
  galleryRoute,
  portfolioRoute,
  blogRoute,
  blogDetailRoute,
  forumRoute,
  forumThreadRoute,
  aboutRoute,
  faqRoute,
  adminDashboardRoute,
  adminProductsRoute,
  adminOrdersRoute,
  adminMessagesRoute,
  adminGalleryRoute,
  adminAnalyticsRoute,
  adminPortfolioRoute,
  adminGalleryContentRoute,
  adminBlogRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AdminAuthProvider>
        <RouterProvider router={router} />
        <Toaster />
      </AdminAuthProvider>
    </ThemeProvider>
  );
}
