import { Loader2 } from 'lucide-react';
import GalleryUploadForm from '../components/GalleryUploadForm';
import AdminGuard from '../components/AdminGuard';

export default function AdminGalleryPage() {
  return (
    <AdminGuard>
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
    </AdminGuard>
  );
}
