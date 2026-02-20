import { useGetCallerUserRole } from '../hooks/useUserProfile';
import { Loader2 } from 'lucide-react';
import GalleryUploadForm from '../components/GalleryUploadForm';
import AccessDeniedScreen from '../components/AccessDeniedScreen';

export default function AdminGalleryPage() {
  const { data: userRole, isLoading: roleLoading } = useGetCallerUserRole();

  const isAdmin = userRole === 'admin';

  if (roleLoading) {
    return (
      <div className="container py-20 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return <AccessDeniedScreen />;
  }

  return (
    <div className="container py-12">
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="font-serif text-4xl font-bold">Manage Gallery</h1>
          <p className="text-muted-foreground">
            Upload and manage social media content
          </p>
        </div>

        <GalleryUploadForm />
      </div>
    </div>
  );
}

