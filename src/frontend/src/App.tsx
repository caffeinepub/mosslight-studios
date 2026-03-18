import { Toaster } from "@/components/ui/sonner";
import {
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";
import React from "react";
import Layout from "./components/Layout";
import { AdminAuthProvider } from "./hooks/useAdminAuth";
import AboutPage from "./pages/AboutPage";
import AdminAnalyticsPage from "./pages/AdminAnalyticsPage";
import AdminBlogPage from "./pages/AdminBlogPage";
import AdminCommissionsPage from "./pages/AdminCommissionsPage";
import AdminCreatorDashboardPage from "./pages/AdminCreatorDashboardPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminDesignTrackerPage from "./pages/AdminDesignTrackerPage";
import AdminGalleryManagementPage from "./pages/AdminGalleryManagementPage";
import AdminGalleryPage from "./pages/AdminGalleryPage";
import AdminMessagesPage from "./pages/AdminMessagesPage";
import AdminOrdersPage from "./pages/AdminOrdersPage";
import AdminPortfolioPage from "./pages/AdminPortfolioPage";
import AdminProductsPage from "./pages/AdminProductsPage";
import AdminSalesPage from "./pages/AdminSalesPage";
import AdminTaskBoardPage from "./pages/AdminTaskBoardPage";
import AdminTimesheetPage from "./pages/AdminTimesheetPage";
import BlogDetailPage from "./pages/BlogDetailPage";
import BlogPage from "./pages/BlogPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import CommissionDetailPage from "./pages/CommissionDetailPage";
import CommissionsPage from "./pages/CommissionsPage";
import FAQPage from "./pages/FAQPage";
import ForumPage from "./pages/ForumPage";
import ForumThreadPage from "./pages/ForumThreadPage";
import GalleryPage from "./pages/GalleryPage";
import HomePage from "./pages/HomePage";
import MyOrdersPage from "./pages/MyOrdersPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import PortfolioPage from "./pages/PortfolioPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import ProductsPage from "./pages/ProductsPage";

const rootRoute = createRootRoute({
  component: Layout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const productsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/products",
  component: ProductsPage,
});

const productDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/products/$id",
  component: ProductDetailPage,
});

const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/cart",
  component: CartPage,
});

const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/checkout",
  component: CheckoutPage,
});

const orderSuccessRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/order-success",
  component: OrderSuccessPage,
});

const myOrdersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/my-orders",
  component: MyOrdersPage,
});

const galleryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/gallery",
  component: GalleryPage,
});

const portfolioRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/portfolio",
  component: PortfolioPage,
});

const blogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/blog",
  component: BlogPage,
});

const blogDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/blog/$id",
  component: BlogDetailPage,
});

const forumRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/forum",
  component: ForumPage,
});

const forumThreadRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/forum/$postId",
  component: ForumThreadPage,
});

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/about",
  component: AboutPage,
});

const faqRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/faq",
  component: FAQPage,
});

const adminDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin-dashboard",
  component: AdminDashboardPage,
});

const adminProductsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/products",
  component: AdminProductsPage,
});

const adminOrdersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/orders",
  component: AdminOrdersPage,
});

const adminMessagesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/messages",
  component: AdminMessagesPage,
});

const adminGalleryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/gallery",
  component: AdminGalleryPage,
});

const adminAnalyticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/analytics",
  component: AdminAnalyticsPage,
});

const adminPortfolioRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/portfolio",
  component: AdminPortfolioPage,
});

const adminGalleryContentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/gallery-content",
  component: AdminGalleryManagementPage,
});

const adminBlogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/blog",
  component: AdminBlogPage,
});

const commissionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/commissions",
  component: CommissionsPage,
});

const commissionDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/commissions/$id",
  component: CommissionDetailPage,
});

const adminCommissionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/commissions",
  component: AdminCommissionsPage,
});

const adminCreatorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/creator",
  component: AdminCreatorDashboardPage,
});

const adminTasksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/tasks",
  component: AdminTaskBoardPage,
});

const adminTimesheetRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/timesheet",
  component: AdminTimesheetPage,
});

const adminSalesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/sales",
  component: AdminSalesPage,
});

const adminDesignsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/designs",
  component: AdminDesignTrackerPage,
});

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center text-center p-8 bg-background">
          <div>
            <h1 className="text-2xl font-bold mb-2 text-foreground">
              Mosslight Studios
            </h1>
            <p className="text-muted-foreground">
              Something went wrong. Please refresh the page.
            </p>
            <button
              type="button"
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
              onClick={() => window.location.reload()}
            >
              Refresh
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

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
  commissionsRoute,
  commissionDetailRoute,
  adminCommissionsRoute,
  adminCreatorRoute,
  adminTasksRoute,
  adminTimesheetRoute,
  adminSalesRoute,
  adminDesignsRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <AdminAuthProvider>
          <RouterProvider router={router} />
          <Toaster />
        </AdminAuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
