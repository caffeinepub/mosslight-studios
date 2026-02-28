import { BlogPost } from '../backend';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from '@tanstack/react-router';
import { CalendarDays } from 'lucide-react';

interface BlogCardProps {
  post: BlogPost;
}

function formatDate(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  return new Date(ms).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function BlogCard({ post }: BlogCardProps) {
  const navigate = useNavigate();
  const excerpt = post.bodyText.length > 150 ? post.bodyText.slice(0, 150) + '...' : post.bodyText;

  return (
    <Card
      className="overflow-hidden group hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => navigate({ to: '/blog/$id', params: { id: post.id } })}
    >
      {post.image && (
        <div className="relative overflow-hidden aspect-video bg-muted">
          <img
            src={post.image.getDirectURL()}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      )}
      {!post.image && (
        <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
          <span className="font-serif text-4xl text-primary/30">✦</span>
        </div>
      )}
      <CardContent className="p-5 space-y-3">
        <h3 className="font-serif font-semibold text-xl leading-tight group-hover:text-primary transition-colors">
          {post.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-3">{excerpt}</p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <CalendarDays className="h-3 w-3" />
          {formatDate(post.createdAt)}
        </div>
      </CardContent>
    </Card>
  );
}
