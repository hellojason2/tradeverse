import { Link } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield } from 'lucide-react';

export function PrivacyPage() {
  useDocumentTitle('Privacy Policy');
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030611] p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-[linear-gradient(135deg,oklch(0.7_0.2_255),oklch(0.5_0.22_262))] mx-auto flex items-center justify-center text-white font-mono font-bold text-lg mb-4">TV</div>
          <h1 className="text-[28px] text-[#f5f7ff] font-serif">Privacy Policy</h1>
          <p className="text-[13px] text-[#8892b0] mt-2">How Tradeverse protects your data</p>
        </div>

        <Card className="bg-[linear-gradient(180deg,rgba(14,20,44,0.6),rgba(8,12,28,0.6))] backdrop-blur-[20px] border-white/[0.08] rounded-[14px]">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mx-auto mb-4">
              <Shield className="w-5 h-5 text-[#7aadff]" />
            </div>
            <p className="text-[14px] text-[#8892b0] mb-6">
              Our full Privacy Policy is being finalized. Check back soon for the complete document.
            </p>
            <Button asChild variant="outline" className="bg-white/[0.03] text-[#8892b0] border-white/[0.08] hover:border-[rgba(120,160,255,0.22)] hover:text-[#f5f7ff]">
              <Link to="/register" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Back to Register
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
