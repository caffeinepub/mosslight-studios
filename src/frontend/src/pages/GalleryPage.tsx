import { useGetSocialMediaContent } from '../hooks/useGallery';
import GalleryItem from '../components/GalleryItem';
import SocialMediaLinks from '../components/SocialMediaLinks';
import { Loader2 } from 'lucide-react';

export default function GalleryPage() {
  const { data: content = [], isLoading } = useGetSocialMediaContent();

  if (isLoading) {
    return (
      <div className="container py-20 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-12">
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="font-serif text-4xl font-bold">Gallery</h1>
          <p className="text-muted-foreground text-lg">
            Explore our creative journey through photos, videos, and stories
          </p>
        </div>

        <div className="flex flex-col items-center gap-4 py-6">
          <h2 className="font-serif text-2xl font-semibold">Follow Us</h2>
          <SocialMediaLinks />
        </div>

        {content.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">
              No content available yet. Check back soon for updates!
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {content.map((item) => (
              <GalleryItem key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
