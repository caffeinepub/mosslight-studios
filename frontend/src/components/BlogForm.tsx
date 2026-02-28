import { useState, useRef } from 'react';
import { useAddBlogPost } from '../hooks/useBlog';
import { ExternalBlob } from '../backend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface BlogFormProps {
  onSuccess?: () => void;
}

export default function BlogForm({ onSuccess }: BlogFormProps) {
  const [title, setTitle] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addBlogPost = useAddBlogPost();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !bodyText.trim()) {
      toast.error('Please provide a title and body text');
      return;
    }

    try {
      let imageBlob: ExternalBlob | null = null;
      if (imageFile) {
        const bytes = new Uint8Array(await imageFile.arrayBuffer());
        imageBlob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) => {
          setUploadProgress(pct);
        });
      }

      await addBlogPost.mutateAsync({
        title: title.trim(),
        bodyText: bodyText.trim(),
        image: imageBlob,
      });

      toast.success('Blog post published!');
      setTitle('');
      setBodyText('');
      setImageFile(null);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onSuccess?.();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to publish blog post');
      setUploadProgress(0);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="blog-title">Title *</Label>
        <Input
          id="blog-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Post title"
          required
        />
      </div>
      <div>
        <Label htmlFor="blog-body">Body *</Label>
        <Textarea
          id="blog-body"
          value={bodyText}
          onChange={(e) => setBodyText(e.target.value)}
          placeholder="Write your blog post here..."
          rows={8}
          required
        />
      </div>
      <div>
        <Label htmlFor="blog-image">Cover Image (optional)</Label>
        <Input
          id="blog-image"
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
        />
        {imageFile && (
          <p className="text-xs text-muted-foreground mt-1">{imageFile.name}</p>
        )}
      </div>
      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Uploading image... {uploadProgress}%</p>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}
      <Button type="submit" disabled={addBlogPost.isPending} className="w-full">
        {addBlogPost.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Publishing...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            Publish Post
          </>
        )}
      </Button>
    </form>
  );
}
