import { useState } from 'react';
import AdminGuard from '../components/AdminGuard';
import GalleryItemForm from '../components/GalleryItemForm';
import { useGetGalleryItems, useDeleteGalleryItem } from '../hooks/useGallery';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminGalleryManagementPage() {
  const [showForm, setShowForm] = useState(false);
  const { data: items = [], isLoading } = useGetGalleryItems();
  const deleteItem = useDeleteGalleryItem();

  const handleDelete = async (id: string) => {
    try {
      await deleteItem.mutateAsync(id);
      toast.success('Gallery item deleted');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete item');
    }
  };

  return (
    <AdminGuard>
      <div className="container py-12">
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-4xl font-bold">Gallery Content</h1>
              <p className="text-muted-foreground mt-1">
                Add and manage gallery photos and behind-the-scenes content
              </p>
            </div>
            <Button onClick={() => setShowForm(!showForm)} className="gap-2">
              {showForm ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Hide Form
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add Photo
                </>
              )}
            </Button>
          </div>

          {showForm && (
            <Card>
              <CardContent className="p-6">
                <h2 className="font-serif text-xl font-semibold mb-4">New Gallery Item</h2>
                <GalleryItemForm onSuccess={() => setShowForm(false)} />
              </CardContent>
            </Card>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              No gallery items yet. Add your first photo above!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <div className="relative aspect-video bg-muted overflow-hidden">
                    <img
                      src={item.image.getDirectURL()}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-4 space-y-2">
                    <h3 className="font-semibold leading-tight">{item.title}</h3>
                    {item.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-full gap-2"
                          disabled={deleteItem.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Gallery Item</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{item.title}"? This action cannot be
                            undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(item.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminGuard>
  );
}
