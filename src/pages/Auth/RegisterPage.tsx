import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { registerApi, oauthLoginApi } from '@/services/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Mail, Lock, User, Globe, Apple, Send, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().min(1, 'Email is required').email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Confirm your password'),
  acceptedTerms: z.boolean().refine((v) => v, { message: 'You must accept the terms' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

export function RegisterPage() {
  useDocumentTitle('Register');
  const { login } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { acceptedTerms: false } });

  const acceptedTerms = watch('acceptedTerms');

  const onSubmit = async (data: FormData) => {
    setApiError(null);
    try {
      const res = await registerApi({
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        acceptedTerms: data.acceptedTerms,
      });
      login(
        { id: res.userId, email: data.email, displayName: data.name, avatarUrl: null, role: 'USER', status: 'NOT_VERIFIED', kycStatus: 'NOT_STARTED' },
        res.accessToken,
        res.refreshToken
      );
      navigate('/dashboard');
    } catch (err: unknown) {
      let message = 'Registration failed. Please try again.';
      if (err && typeof err === 'object') {
        const e = err as Record<string, unknown>;
        if (typeof e.message === 'string') message = e.message;
        else if (typeof e.response === 'object' && e.response !== null) {
          const d = (e.response as Record<string, unknown>).data as Record<string, unknown> | undefined;
          const em = d?.error as Record<string, unknown> | undefined;
          if (typeof em?.message === 'string') message = em.message;
        }
      }
      setApiError(message);
    }
  };

  const handleOAuth = async (provider: 'google' | 'apple' | 'telegram') => {
    setApiError(null);
    try {
      const res = await oauthLoginApi(provider);
      login(res.user, res.accessToken, res.refreshToken);
      navigate('/dashboard');
    } catch (err: unknown) {
      let message = `Failed to sign in with ${provider}.`;
      if (err && typeof err === 'object') {
        const e = err as Record<string, unknown>;
        if (typeof e.message === 'string') message = e.message;
      }
      setApiError(message);
    }
  };

  const oauthProviders = [
    { name: 'Google', key: 'google' as const, icon: Globe, color: '#ea4335' },
    { name: 'Apple', key: 'apple' as const, icon: Apple, color: '#f5f7ff' },
    { name: 'Telegram', key: 'telegram' as const, icon: Send, color: '#229ed9' },
  ];

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#030611] p-4">
      <div className="absolute top-4 right-4"><LanguageSwitcher /></div>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-[linear-gradient(135deg,oklch(0.7_0.2_255),oklch(0.5_0.22_262))] mx-auto flex items-center justify-center text-white font-mono font-bold text-lg mb-4">TV</div>
          <h1 className="text-[28px] text-[#f5f7ff] font-serif">Create account</h1>
          <p className="text-[13px] text-[#8892b0] mt-2">Start your trading journey with Tradeverse</p>
        </div>

        <Card className="bg-[linear-gradient(180deg,rgba(14,20,44,0.6),rgba(8,12,28,0.6))] backdrop-blur-[20px] border-white/[0.08] rounded-[14px]">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div>
                <Label className="text-[11px] font-mono uppercase tracking-[0.08em] text-[#8892b0]">Full Name</Label>
                <div className="relative mt-1.5">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#545d78]" />
                  <Input
                    placeholder="Alex Morgan"
                    className="pl-10 bg-white/[0.03] border-white/[0.08] focus:border-[rgba(120,160,255,0.22)] focus:shadow-[0_0_0_3px_oklch(0.55_0.22_260/0.15)]"
                    {...register('name', {
                      onChange: () => setApiError(null),
                    })}
                  />
                </div>
                {errors.name && <p className="mt-1 text-[11px] text-[#ff5555] font-mono">{errors.name.message}</p>}
              </div>

              <div>
                <Label className="text-[11px] font-mono uppercase tracking-[0.08em] text-[#8892b0]">Email</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#545d78]" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    className="pl-10 bg-white/[0.03] border-white/[0.08] focus:border-[rgba(120,160,255,0.22)] focus:shadow-[0_0_0_3px_oklch(0.55_0.22_260/0.15)]"
                    {...register('email', {
                      onChange: () => setApiError(null),
                    })}
                  />
                </div>
                {errors.email && <p className="mt-1 text-[11px] text-[#ff5555] font-mono">{errors.email.message}</p>}
              </div>

              <div>
                <Label className="text-[11px] font-mono uppercase tracking-[0.08em] text-[#8892b0]">Password</Label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#545d78]" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 bg-white/[0.03] border-white/[0.08] focus:border-[rgba(120,160,255,0.22)] focus:shadow-[0_0_0_3px_oklch(0.55_0.22_260/0.15)]"
                    {...register('password', {
                      onChange: () => setApiError(null),
                    })}
                  />
                </div>
                {errors.password && <p className="mt-1 text-[11px] text-[#ff5555] font-mono">{errors.password.message}</p>}
              </div>

              <div>
                <Label className="text-[11px] font-mono uppercase tracking-[0.08em] text-[#8892b0]">Confirm Password</Label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#545d78]" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 bg-white/[0.03] border-white/[0.08] focus:border-[rgba(120,160,255,0.22)] focus:shadow-[0_0_0_3px_oklch(0.55_0.22_260/0.15)]"
                    {...register('confirmPassword', {
                      onChange: () => setApiError(null),
                    })}
                  />
                </div>
                {errors.confirmPassword && <p className="mt-1 text-[11px] text-[#ff5555] font-mono">{errors.confirmPassword.message}</p>}
              </div>

              <div className="flex items-start gap-2">
                <Checkbox
                  id="terms"
                  checked={acceptedTerms}
                  onCheckedChange={(v) => setValue('acceptedTerms', v === true, { shouldValidate: true })}
                  className="mt-0.5 border-white/[0.14] data-[state=checked]:bg-[#4f8eff] data-[state=checked]:border-[#4f8eff]"
                />
                <Label htmlFor="terms" className="text-[12px] text-[#8892b0] font-normal cursor-pointer">
                  I agree to the{' '}
                  <Link to="/terms" className="text-[#7aadff] hover:text-[#4f8eff]">Terms of Service</Link>
                  {' '}and{' '}
                  <Link to="/privacy" className="text-[#7aadff] hover:text-[#4f8eff]">Privacy Policy</Link>
                </Label>
              </div>
              {errors.acceptedTerms && <p className="text-[11px] text-[#ff5555] font-mono">{errors.acceptedTerms.message}</p>}

              {apiError && (
                <Alert variant="destructive" className="text-[12px] bg-[rgba(255,85,85,0.08)] border-[oklch(0.68_0.22_20/0.3)] text-[#ff5555]">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{apiError}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-[linear-gradient(180deg,oklch(0.7_0.2_255),oklch(0.52_0.22_262))] text-white border-0 hover:brightness-110 h-10"
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/[0.06]" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#030611] px-2 text-[#545d78]">or continue with</span></div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {oauthProviders.map((provider) => {
                const Icon = provider.icon;
                return (
                  <Button
                    key={provider.name}
                    variant="outline"
                    type="button"
                    className="bg-white/[0.03] text-[#8892b0] border-white/[0.08] hover:border-[rgba(120,160,255,0.22)] hover:text-[#f5f7ff] text-[12px] h-10"
                    onClick={() => handleOAuth(provider.key)}
                  >
                    <Icon className="w-4 h-4 mr-1.5" style={{ color: provider.color }} />
                    {provider.name}
                  </Button>
                );
              })}
            </div>

            <div className="text-center mt-6 text-[13px] text-[#8892b0]">
              Already have an account?{' '}
              <Link to="/login" className="text-[#7aadff] hover:text-[#4f8eff]">Sign in</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
