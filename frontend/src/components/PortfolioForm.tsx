import { useState, useRef } from 'react';
import { useAddPortfolioItem } from '../hooks/usePortfolio';
import { ExternalBlob } from '../backend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface PortfolioFormProps {
  onSuccess?: () => void;
}

export default function PortfolioForm({ onSuccess }: PortfolioFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addPortfolioItem = useAddPortfolioItem();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !category.trim() || !imageFile) {
      toast.error('Please fill in all required fields and select an image');
      return;
    }

    try {
      const bytes = new Uint8Array(await imageFile.arrayBuffer());
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) => {
        setUploadProgress(pct);
      });

      await addPortfolioItem.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        image: blob,
        category: category.trim(),
      });

      toast.success('Portfolio item added!');
      setTitle('');
      setDescription('');
      setCategory('');
      setImageFile(null);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onSuccess?.();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add portfolio item');
      setUploadProgress(0);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="portfolio-title">Title *</Label>
        <Input
          id="portfolio-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Artwork title"
          required
        />
      </div>
      <div>
        <Label htmlFor="portfolio-category">Category *</Label>
        <Input
          id="portfolio-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="e.g. Painting, Illustration, Digital"
          required
        />
      </div>
      <div>
        <Label htmlFor="portfolio-description">Description</Label>
        <Textarea
          id="portfolio-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe this piece..."
          rows={3}
        />
      </div>
      <div>
        <Label htmlFor="portfolio-image">Image *</Label>
        <div className="mt-1 flex items-center gap-3">
          <Input
            id="portfolio-image"
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            required
          />
        </div>
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
      <Button type="submit" disabled={addPortfolioItem.isPending} className="w-full">
        {addPortfolioItem.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Adding...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            Add Portfolio Item
          </>
        )}
      </Button>
    </form>
  );
}
