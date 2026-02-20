import { Instagram, Facebook } from 'lucide-react';
import { SiTiktok } from 'react-icons/si';

interface SocialMediaLinksProps {
  className?: string;
}

export default function SocialMediaLinks({ className = '' }: SocialMediaLinksProps) {
  const socialLinks = [
    {
      name: 'Instagram',
      url: 'https://instagram.com/mosslightstudios',
      icon: Instagram,
    },
    {
      name: 'Facebook',
      url: 'https://facebook.com/mosslightstudios',
      icon: Facebook,
    },
    {
      name: 'TikTok',
      url: 'https://tiktok.com/@mosslightstudios',
      icon: SiTiktok,
    },
  ];

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {socialLinks.map((link) => {
        const Icon = link.icon;
        return (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary transition-colors"
            aria-label={link.name}
          >
            <Icon className="h-6 w-6" />
          </a>
        );
      })}
    </div>
  );
}
