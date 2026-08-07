
import React, { useState } from 'react';
import { Chrome } from 'lucide-react';
import { apiClient } from '../utils/api';
import { toast } from 'sonner';

const Login = ({ onLogin, onSwitchToRegister }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    const handleGoogleLogin = async () => {
        setIsGoogleLoading(true);
        try {
            toast.loading('Connecting with Google...', { id: 'google-login' });
            
            // Simulate Google OAuth - in real app, this would use Google OAuth flow
            const googleData = {
                token: 'mock-google-token',
                email: 'user@gmail.com',
                full_name: 'Google User'
            };
            
            const user = await apiClient.googleAuth(googleData);
            
            toast.success('Successfully authenticated with Google!', {
                id: 'google-login',
                description: `Welcome back, ${user.full_name}!`,
            });
            
            onLogin(user);
        } catch (error) {
            toast.error('Google authentication failed', {
                id: 'google-login',
                description: error.message || 'Failed to authenticate with Google',
            });
        } finally {
            setIsGoogleLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            toast.loading('Signing in...', { id: 'login' });
            
            const user = await apiClient.login({
                email: email,
                password: password
            });
            
            toast.success('Login successful!', {
                id: 'login',
                description: `Welcome back, ${user.full_name}!`,
            });
            
            onLogin(user);
        } catch (error) {
            toast.error('Login failed', {
                id: 'login',
                description: error.message || 'Invalid email or password',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl mix-blend-screen pointer-events-none animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl mix-blend-screen pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />

            <div className="max-w-md w-full bg-slate-800/80 backdrop-blur-xl border border-slate-700 rounded-xl p-8 shadow-2xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-500">
                <div className="text-center mb-8">
                    <div className="inline-flex h-12 w-12 bg-blue-600 rounded-lg items-center justify-center mb-4">
                        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Welcome Back</h2>
                    <p className="text-slate-400 mt-2">Sign in to DevInsight</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                            placeholder="admin@devinsight.io"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-lg shadow-sm transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Authenticating...
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </button>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-700"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-slate-800 text-slate-400">Or continue with</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={isGoogleLoading}
                        className="w-full bg-white text-slate-900 border border-slate-300 font-bold py-3.5 rounded-lg hover:bg-slate-50 transition-colors duration-300 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isGoogleLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Connecting with Google...
                            </>
                        ) : (
                            <>
                                <Chrome className="w-5 h-5" />
                                Sign in with Google
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-slate-400 text-sm">
                        Don't have an account?{' '}
                        <button
                            onClick={onSwitchToRegister}
                            className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                        >
                            Create Account
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
