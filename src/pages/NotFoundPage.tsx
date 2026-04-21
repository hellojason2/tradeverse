import { Link } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  useDocumentTitle('Page Not Found');
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030611] p-4">
      <div className="text-center">
        <div className="text-[72px] font-mono font-bold text-[#4f8eff] mb-4">404</div>
        <h1 className="text-[20px] text-[#f5f7ff] font-serif mb-2">Page not found</h1>
        <p className="text-[13px] text-[#8892b0] mb-8">The page you are looking for does not exist.</p>
        <Button asChild className="bg-[#4f8eff] text-white hover:bg-[#4f8eff]/90">
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
