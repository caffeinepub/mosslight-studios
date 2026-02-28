import { useState, useRef } from 'react';
import { useAddGalleryItem } from '../hooks/useGallery';
import { ExternalBlob } from '../backend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface GalleryItemFormProps {
  onSuccess?: () => void;
}

export default function GalleryItemForm({ onSuccess }: GalleryItemFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addGalleryItem = useAddGalleryItem();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageFile) {
      toast.error('Please provide a title and select an image');
      return;
    }

    try {
      const bytes = new Uint8Array(await imageFile.arrayBuffer());
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) => {
        setUploadProgress(pct);
      });

      await addGalleryItem.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        image: blob,
      });

      toast.success('Gallery item added!');
      setTitle('');
      setDescription('');
      setImageFile(null);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onSuccess?.();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add gallery item');
      setUploadProgress(0);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="gallery-title">Title *</Label>
        <Input
          id="gallery-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Photo title"
          required
        />
      </div>
      <div>
        <Label htmlFor="gallery-description">Description</Label>
        <Textarea
          id="gallery-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe this photo..."
          rows={3}
        />
      </div>
      <div>
        <Label htmlFor="gallery-image">Image *</Label>
        <Input
          id="gallery-image"
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          required
        />
        {imageFile && (
          <p className="text-xs text-muted-foreground mt-1">{imageFile.name}</p>
        )}
      </div>
      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Uploading... {uploadProgress}%</p>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}
      <Button type="submit" disabled={addGalleryItem.isPending} className="w-full">
        {addGalleryItem.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Adding...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            Add Gallery Item
          </>
        )}
      </Button>
    </form>
  );
}
