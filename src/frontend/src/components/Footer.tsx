import { ClipboardList, Heart } from "lucide-react";
import SocialMediaLinks from "./SocialMediaLinks";

const SURVEY_URL = "https://forms.gle/iHpYScSV2sfthoPb8";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const appIdentifier =
    typeof window !== "undefined"
      ? encodeURIComponent(window.location.hostname)
      : "mosslight-studios";

  return (
    <footer className="border-t bg-muted/30 mt-auto">
      <div className="container py-8">
        <div className="flex flex-col items-center gap-6">
          <SocialMediaLinks />

          <a
            href={SURVEY_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-ocid="footer.survey_button"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
          >
            <ClipboardList className="h-4 w-4 group-hover:text-primary transition-colors" />
            <span className="underline underline-offset-4 decoration-muted-foreground/40 group-hover:decoration-primary">
              Share Your Feedback
            </span>
          </a>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 w-full">
            <div className="text-sm text-muted-foreground">
              © {currentYear} Mosslight Studios. All rights reserved.
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Built with</span>
              <Heart className="h-4 w-4 text-primary fill-primary" />
              <span>using</span>
              <a
                href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appIdentifier}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                caffeine.ai
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
