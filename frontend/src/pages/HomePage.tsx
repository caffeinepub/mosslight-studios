import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Package, Heart } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section 
        className="relative h-[600px] flex items-center justify-center bg-cover bg-center"
        style={{ backgroundImage: 'url(/assets/generated/hero-bg.dim_1920x800.png)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
        <div className="relative z-10 container text-center space-y-6 px-4">
          <h1 className="font-serif text-5xl md:text-7xl font-bold" style={{ color: '#F5F0E8' }}>
            Mosslight Studios
          </h1>
          <p className="text-xl md:text-2xl max-w-2xl mx-auto" style={{ color: '#F5F0E8' }}>
            Handcrafted treasures inspired by nature's elegance
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button asChild size="lg" className="gap-2">
              <Link to="/products">
                Shop Collection <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2">
              <Link to="/gallery">
                View Gallery <Sparkles className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-primary/10 p-6">
                  <Package className="h-10 w-10 text-primary" />
                </div>
              </div>
              <h3 className="font-serif text-xl font-semibold">Curated Collection</h3>
              <p className="text-muted-foreground">
                Each piece is carefully selected and crafted with attention to detail
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-primary/10 p-6">
                  <Heart className="h-10 w-10 text-primary" />
                </div>
              </div>
              <h3 className="font-serif text-xl font-semibold">Made with Love</h3>
              <p className="text-muted-foreground">
                Every item is created with passion and dedication to quality
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-primary/10 p-6">
                  <Sparkles className="h-10 w-10 text-primary" />
                </div>
              </div>
              <h3 className="font-serif text-xl font-semibold">Unique Designs</h3>
              <p className="text-muted-foreground">
                Original creations you won't find anywhere else
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section 
        className="py-20 bg-cover bg-center relative"
        style={{ backgroundImage: 'url(/assets/generated/gradient-pattern.dim_1200x600.png)' }}
      >
        <div className="absolute inset-0 bg-background/80" />
        <div className="relative z-10 container text-center space-y-6">
          <h2 className="font-serif text-4xl md:text-5xl font-bold">
            Discover Your Next Treasure
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Browse our collection of handcrafted items and find something special
          </p>
          <Button asChild size="lg" className="gap-2">
            <Link to="/products">
              Start Shopping <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
