import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, Upload, X } from 'lucide-react';
import { useAddSocialMediaContent } from '../hooks/useGallery';
import { ExternalBlob } from '../backend';
import { toast } from 'sonner';

export default function GalleryUploadForm() {
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const addContent = useAddSocialMediaContent();

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setMediaFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim() && mediaFiles.length === 0) {
      toast.error('Please add content or media');
      return;
    }

    try {
      let media: ExternalBlob[] = [];

      if (mediaFiles.length > 0) {
        setUploadProgress(0);
        const mediaPromises = mediaFiles.map(async (file, index) => {
          const bytes = new Uint8Array(await file.arrayBuffer());
          const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((percentage) => {
            setUploadProgress((prev) => Math.max(prev, (index + percentage / 100) / mediaFiles.length * 100));
          });
          return blob;
        });
        media = await Promise.all(mediaPromises);
      }

      await addContent.mutateAsync({
        content: content.trim(),
        media,
      });

      toast.success('Content added to gallery');
      setContent('');
      setMediaFiles([]);
      setUploadProgress(0);
    } catch (error) {
      toast.error('Failed to add content');
      console.error(error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif">Upload Content</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="content">Content Text</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter content description or message..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="media">Media Files (Images/Videos)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="media"
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleMediaChange}
                className="flex-1"
              />
              {mediaFiles.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setMediaFiles([])}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {mediaFiles.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {mediaFiles.length} file(s) selected
              </p>
            )}
          </div>

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="space-y-2">
              <Label>Upload Progress</Label>
              <Progress value={uploadProgress} />
            </div>
          )}
        </CardContent>

        <CardFooter>
          <Button type="submit" disabled={addContent.isPending} className="gap-2">
            {addContent.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Add to Gallery
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

