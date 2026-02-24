import { Badge } from '@/components/ui/badge';
import type { PostStatus } from '../backend';

interface PostStatusBadgeProps {
  status: PostStatus;
}

export default function PostStatusBadge({ status }: PostStatusBadgeProps) {
  const getStyles = () => {
    switch (status) {
      case 'open':
        return 'bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400';
      case 'answered':
        return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400';
      default:
        return '';
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'open':
        return 'Open';
      case 'answered':
        return 'Answered';
      default:
        return status;
    }
  };

  return (
    <Badge className={getStyles()}>
      {getLabel()}
    </Badge>
  );
}
