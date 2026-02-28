import { useGetGalleryItems } from '../hooks/useGallery';
import GalleryGrid from '../components/GalleryGrid';
import SocialMediaLinks from '../components/SocialMediaLinks';

export default function GalleryPage() {
  const { data: items = [], isLoading } = useGetGalleryItems();

  return (
    <div className="container py-12">
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="font-serif text-4xl font-bold">Gallery</h1>
          <p className="text-muted-foreground text-lg">
            Explore photos and behind-the-scenes moments from the studio
          </p>
        </div>

        <div className="flex flex-col items-center gap-4 py-4">
          <h2 className="font-serif text-xl font-semibold">Follow Us</h2>
          <SocialMediaLinks />
        </div>

        <GalleryGrid items={items} isLoading={isLoading} />
      </div>
    </div>
  );
}
