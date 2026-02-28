import { useGetPortfolioItems } from '../hooks/usePortfolio';
import PortfolioGrid from '../components/PortfolioGrid';

export default function PortfolioPage() {
  const { data: items = [], isLoading } = useGetPortfolioItems();

  return (
    <div className="container py-12">
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="font-serif text-4xl font-bold">Portfolio</h1>
          <p className="text-muted-foreground text-lg">
            A curated collection of finished artwork and creative pieces
          </p>
        </div>

        <PortfolioGrid items={items} isLoading={isLoading} />
      </div>
    </div>
  );
}
