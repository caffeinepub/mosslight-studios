import { useState } from 'react';
import { Copy, Check, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { toast } from 'sonner';

export default function PrincipalDisplay() {
  const { identity } = useInternetIdentity();
  const [copied, setCopied] = useState(false);

  if (!identity) return null;

  const principal = identity.getPrincipal().toString();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(principal);
      setCopied(true);
      toast.success('Principal copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy. Please select and copy the text manually.');
    }
  };

  return (
    <div className="w-full border-b bg-primary/5 border-primary/20">
      <div className="container py-2 flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <div className="flex items-center gap-2 shrink-0">
          <Key className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-primary uppercase tracking-wide">
            Your Internet Identity Principal:
          </span>
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <code className="text-xs font-mono bg-background border border-border rounded px-2 py-1 text-foreground select-all break-all flex-1">
            {principal}
          </code>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="shrink-0 h-7 px-2 gap-1 text-xs border-primary/30 hover:bg-primary/10 hover:text-primary"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-green-600" />
                <span className="text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copy
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
