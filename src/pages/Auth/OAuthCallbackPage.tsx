import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/services/api-client';
import type { ApiResponse, LoginResponse } from '@contracts/routes';
import { Loader2 } from 'lucide-react';

export function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const provider = searchParams.get('provider');
    const code = searchParams.get('code');

    if (!provider || !code) {
      navigate('/login');
      return;
    }

    apiClient
      .post<ApiResponse<LoginResponse>>(`/auth/oauth/${provider}`, { code })
      .then((res) => {
        if ('error' in res) throw new Error(res.error.message);
        login(res.data.user, res.data.accessToken, res.data.refreshToken);
        navigate('/');
      })
      .catch(() => {
        navigate('/login');
      });
  }, [searchParams, login, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030611]">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#4f8eff] mx-auto mb-4" />
        <p className="text-[13px] text-[#8892b0]">Completing sign-in...</p>
      </div>
    </div>
  );
}
