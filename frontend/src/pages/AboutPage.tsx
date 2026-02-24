import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Instagram, Facebook } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="space-y-4 text-center">
          <h1 className="font-serif text-5xl font-bold text-primary">About Mosslight Studios</h1>
          <p className="text-xl text-muted-foreground">
            Crafting beauty, one piece at a time
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="font-serif text-2xl">Our Story</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p className="text-muted-foreground leading-relaxed">
                Mosslight Studios was born from a passion for creating unique, handcrafted pieces that bring
                warmth and character to everyday life. Each item in our collection is thoughtfully designed
                and carefully crafted with attention to detail and quality.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                We believe in the beauty of handmade artistry and the stories that each piece tells. From
                concept to creation, every product reflects our commitment to excellence and our love for
                the craft.
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="font-serif text-2xl">Our Mission</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p className="text-muted-foreground leading-relaxed">
                Our mission is to create timeless pieces that inspire joy and connection. We're dedicated to
                sustainable practices, quality craftsmanship, and building a community of people who
                appreciate the art of handmade goods.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Every purchase supports our small studio and helps us continue doing what we love—creating
                beautiful, meaningful pieces for you and your loved ones.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="font-serif text-2xl text-center">Get In Touch</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Mail className="h-5 w-5 text-primary" />
                <a
                  href="mailto:hello@mosslightstudios.com"
                  className="hover:text-primary transition-colors"
                >
                  hello@mosslightstudios.com
                </a>
              </div>

              <div className="pt-4">
                <p className="text-sm text-muted-foreground mb-4">Follow us on social media</p>
                <div className="flex justify-center gap-4">
                  <a
                    href="https://instagram.com/mosslightstudios"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Instagram className="h-6 w-6" />
                  </a>
                  <a
                    href="https://facebook.com/mosslightstudios"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Facebook className="h-6 w-6" />
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
