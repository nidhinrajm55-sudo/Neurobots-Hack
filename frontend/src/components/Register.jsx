import React, { useState } from 'react';
import { Chrome, User, Mail, Lock, CheckCircle } from 'lucide-react';
import { apiClient } from '../utils/api';
import { toast } from 'sonner';

const Register = ({ onRegister, onSwitchToLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);

    const handleGoogleSignUp = async () => {
        setIsGoogleLoading(true);
        try {
            toast.loading('Creating account with Google...', { id: 'google-register' });
            
            // Simulate Google OAuth - in real app, this would use Google OAuth flow
            const googleData = {
                token: 'mock-google-token',
                email: 'user@gmail.com',
                full_name: 'Google User'
            };
            
            const user = await apiClient.googleAuth(googleData);
            
            toast.success('Account created successfully!', {
                id: 'google-register',
                description: `Welcome to DevInsight, ${user.full_name}!`,
            });
            
            onRegister(user);
        } catch (error) {
            toast.error('Google registration failed', {
                id: 'google-register',
                description: error.message || 'Failed to create account with Google',
            });
        } finally {
            setIsGoogleLoading(false);
        }
    };

    const calculatePasswordStrength = (password) => {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
        if (password.match(/[0-9]/)) strength++;
        if (password.match(/[^a-zA-Z0-9]/)) strength++;
        setPasswordStrength(strength);
    };

    const handlePasswordChange = (e) => {
        const newPassword = e.target.value;
        setPassword(newPassword);
        calculatePasswordStrength(newPassword);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error('Passwords do not match', {
                description: 'Please ensure both passwords are the same',
            });
            return;
        }
        
        if (passwordStrength < 2) {
            toast.error('Password too weak', {
                description: 'Please use a stronger password with mixed case, numbers, and symbols',
            });
            return;
        }

        setIsLoading(true);
        try {
            toast.loading('Creating account...', { id: 'register' });
            
            const user = await apiClient.register({
                full_name: fullName,
                email: email,
                password: password
            });
            
            toast.success('Account created successfully!', {
                id: 'register',
                description: `Welcome to DevInsight, ${user.full_name}!`,
            });
            
            onRegister(user);
        } catch (error) {
            toast.error('Registration failed', {
                id: 'register',
                description: error.message || 'Failed to create account',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl mix-blend-screen pointer-events-none animate-pulse" />
            <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl mix-blend-screen pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />

            <div className="max-w-md w-full bg-slate-800/80 backdrop-blur-xl border border-slate-700 rounded-xl p-8 shadow-2xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-500">
                <div className="text-center mb-6">
                    <div className="inline-flex h-12 w-12 bg-blue-600 rounded-lg items-center justify-center mb-4">
                        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Join DevInsight</h2>
                    <p className="text-slate-400 mt-2">Start analyzing your architecture today.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                placeholder="John Doe"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Work Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                placeholder="you@company.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                            <input
                                type="password"
                                value={password}
                                onChange={handlePasswordChange}
                                required
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                placeholder="Min. 8 characters"
                            />
                        </div>
                        {password && (
                            <div className="mt-2">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="flex-1 bg-slate-700 rounded-full h-2">
                                        <div 
                                            className={`h-2 rounded-full transition-all duration-300 ${
                                                passwordStrength === 0 ? 'bg-red-500 w-1/4' :
                                                passwordStrength === 1 ? 'bg-orange-500 w-2/4' :
                                                passwordStrength === 2 ? 'bg-yellow-500 w-3/4' :
                                                'bg-green-500 w-full'
                                            }`}
                                        />
                                    </div>
                                    <span className="text-xs text-slate-400">
                                        {passwordStrength === 0 ? 'Weak' :
                                         passwordStrength === 1 ? 'Fair' :
                                         passwordStrength === 2 ? 'Good' : 'Strong'}
                                    </span>
                                </div>
                                <div className="text-xs text-slate-500">
                                    Use 8+ characters with mixed case, numbers, and symbols
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                placeholder="Matches password above"
                            />
                            {confirmPassword && password === confirmPassword && (
                                <CheckCircle className="absolute right-3 top-3.5 h-5 w-5 text-green-500" />
                            )}
                        </div>
                        {confirmPassword && password !== confirmPassword && (
                            <div className="mt-1 text-xs text-red-400">Passwords do not match</div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-lg shadow-sm transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center mt-4"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Creating Account...
                            </>
                        ) : (
                            'Create Account'
                        )}
                    </button>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-700"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-slate-800 text-slate-400">Or sign up with</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogleSignUp}
                        disabled={isGoogleLoading}
                        className="w-full bg-white text-slate-900 border border-slate-300 font-bold py-3.5 rounded-lg hover:bg-slate-50 transition-colors duration-300 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isGoogleLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Creating with Google...
                            </>
                        ) : (
                            <>
                                <Chrome className="w-5 h-5" />
                                Sign up with Google
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-slate-400 text-sm">
                        Already have an account?{' '}
                        <button
                            onClick={onSwitchToLogin}
                            className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                        >
                            Sign In
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
