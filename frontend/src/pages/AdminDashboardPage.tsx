import { useNavigate } from '@tanstack/react-router';
import AdminGuard from '../components/AdminGuard';
import AdminNotificationsPanel from '../components/AdminNotificationsPanel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Package,
  ShoppingBag,
  MessageSquare,
  Image,
  MessageCircle,
  BarChart3,
  Palette,
  BookOpen,
  Camera,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const navigate = useNavigate();

  const adminSections = [
    {
      title: 'Product Management',
      description: 'Add, edit, and manage your product catalog',
      icon: Package,
      path: '/admin/products',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950',
    },
    {
      title: 'Order Management',
      description: 'View and manage customer orders',
      icon: ShoppingBag,
      path: '/admin/orders',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      title: 'Customer Messaging',
      description: 'Send messages to customers',
      icon: MessageSquare,
      path: '/admin/messages',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950',
    },
    {
      title: 'Social Media Gallery',
      description: 'Upload and manage social media content',
      icon: Image,
      path: '/admin/gallery',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-950',
    },
    {
      title: 'Discussion Board',
      description: 'Reply to customer questions and manage forum',
      icon: MessageCircle,
      path: '/forum',
      color: 'text-rose-600',
      bgColor: 'bg-rose-50 dark:bg-rose-950',
    },
    {
      title: 'Analytics',
      description: 'View performance metrics and insights',
      icon: BarChart3,
      path: '/admin/analytics',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950',
    },
    {
      title: 'Portfolio Management',
      description: 'Add and manage your portfolio artwork pieces',
      icon: Palette,
      path: '/admin/portfolio',
      color: 'text-teal-600',
      bgColor: 'bg-teal-50 dark:bg-teal-950',
    },
    {
      title: 'Gallery Content',
      description: 'Upload photos and behind-the-scenes content',
      icon: Camera,
      path: '/admin/gallery-content',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950',
    },
    {
      title: 'Blog Management',
      description: 'Write and manage your blog posts',
      icon: BookOpen,
      path: '/admin/blog',
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50 dark:bg-cyan-950',
    },
  ];

  return (
    <AdminGuard>
      <div className="container py-12">
        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="font-serif text-4xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage all aspects of your Mosslight Studios store
            </p>
          </div>

          <AdminNotificationsPanel />

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {adminSections.map((section) => {
              const Icon = section.icon;
              return (
                <Card
                  key={section.path}
                  className="hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => navigate({ to: section.path })}
                >
                  <CardHeader>
                    <div
                      className={`w-12 h-12 rounded-lg ${section.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                    >
                      <Icon className={`h-6 w-6 ${section.color}`} />
                    </div>
                    <CardTitle className="font-serif">{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">
                      Open
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
