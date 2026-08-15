'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { loginSchema, type LoginInput } from '@/lib/validators/user';
import { Eye, EyeOff, Loader2, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // CAPTCHA state
  const [captchaText, setCaptchaText] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let text = '';
    for (let i = 0; i < 6; i++) {
      text += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(text);
    setCaptchaInput('');
    setCaptchaError('');

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Background
        ctx.fillStyle = '#e5e7eb'; // gray-200
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add noise/lines
        for (let i = 0; i < 6; i++) {
          ctx.strokeStyle = `rgba(${Math.random() * 200},${Math.random() * 200},${Math.random() * 200}, 0.5)`;
          ctx.lineWidth = 1 + Math.random() * 1.5;
          ctx.beginPath();
          ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
          ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
          ctx.stroke();
        }

        // Draw text
        ctx.font = 'bold 22px monospace';
        ctx.fillStyle = '#1f2937'; // gray-800
        ctx.textBaseline = 'middle';
        
        // Draw characters with slight random rotation
        for (let i = 0; i < text.length; i++) {
          ctx.save();
          const x = 20 + i * 18;
          const y = canvas.height / 2;
          ctx.translate(x, y);
          const angle = (Math.random() - 0.5) * 0.4; // -0.2 to 0.2 rad
          ctx.rotate(angle);
          ctx.fillText(text[i], 0, 0);
          ctx.restore();
        }
      }
    }
  };

  // Generate initial CAPTCHA on mount
  useEffect(() => {
    generateCaptcha();
  }, []);

  const onSubmit = async (data: LoginInput) => {
    // Validate CAPTCHA first
    if (captchaInput !== captchaText) {
      setCaptchaError('Incorrect CAPTCHA. Please try again.');
      generateCaptcha();
      return;
    }

    setIsLoading(true);
    setError(null);
    setCaptchaError('');

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
        generateCaptcha(); // regenerate on failed login
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      generateCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-md w-full space-y-8 bg-card p-10 rounded-xl shadow-lg border border-border">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-card-foreground">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Faculty Class Allocation System
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className={`appearance-none block w-full px-3 py-2 border ${errors.email ? 'border-red-500' : 'border-border'} rounded-md shadow-sm bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm`}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className={`appearance-none block w-full px-3 py-2 border ${errors.password ? 'border-red-500' : 'border-border'} rounded-md shadow-sm bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm pr-10`}
                  {...register('password')}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>
            </div>

            {/* CAPTCHA SECTION */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Security Check
              </label>
              <div className="flex items-center gap-3 mb-3">
                <canvas
                  ref={canvasRef}
                  width="140"
                  height="40"
                  className="rounded border border-border cursor-pointer shadow-sm"
                  onClick={generateCaptcha}
                  title="Click to refresh CAPTCHA"
                />
                <button
                  type="button"
                  onClick={generateCaptcha}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                  title="Refresh CAPTCHA"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Enter the characters above"
                  value={captchaInput}
                  onChange={(e) => {
                    setCaptchaInput(e.target.value);
                    if (captchaError) setCaptchaError('');
                  }}
                  className={`appearance-none block w-full px-3 py-2 border ${captchaError ? 'border-red-500' : 'border-border'} rounded-md shadow-sm bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm`}
                  required
                />
                {captchaError && (
                  <p className="mt-1 text-sm text-red-500">{captchaError}</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors ring-offset-background"
            >
              {isLoading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
