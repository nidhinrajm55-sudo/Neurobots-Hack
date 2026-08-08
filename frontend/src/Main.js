'use client';
import { useState, useEffect } from 'react';
import Layout from './components/Layout';
// Card imported but not used? It was in original file imports, I'll keep it.
import Card from './components/Card';
import Dashboard from './components/Dashboard';
import Problems from './components/Problems';
import Prioritization from './components/Prioritization';
import BlastRadius from './components/BlastRadius';
import SecurityBot from './components/SecurityBot';
import { Toaster } from 'sonner';

import Login from './components/Login';
import Register from './components/Register';

function MainApp() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [authView, setAuthView] = useState('login'); // 'login' or 'register'
    const [activeTab, setActiveTab] = useState('Dashboard');
    const [currentTheme, setCurrentTheme] = useState('light');
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        const auth = localStorage.getItem('isAuthenticated') === 'true';
        const savedUser = localStorage.getItem('user');
        const savedTheme = localStorage.getItem('appTheme') || 'light';
        if (auth) setIsAuthenticated(true);
        if (savedUser) setUser(JSON.parse(savedUser));
        setCurrentTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
        setIsMounted(true);
    }, []);

    const handleThemeChange = (newTheme) => {
        setCurrentTheme(newTheme);
        localStorage.setItem('appTheme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    const handleLogin = (userParam) => {
        let userObj;
        if (typeof userParam === 'string') {
            userObj = {
                name: userParam.split('@')[0],
                email: userParam,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userParam}`
            };
        } else if (userParam && typeof userParam === 'object') {
            const emailStr = userParam.email || '';
            userObj = {
                name: userParam.full_name || (emailStr.includes('@') ? emailStr.split('@')[0] : 'User'),
                email: emailStr,
                avatar: userParam.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${emailStr}`
            };
        } else {
            userObj = { name: 'User', email: '', avatar: '' };
        }
        setIsAuthenticated(true);
        setUser(userObj);
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify(userObj));
    };

    const handleRegister = (userParam) => {
        let userObj;
        if (typeof userParam === 'string') {
            userObj = {
                name: userParam.split('@')[0],
                email: userParam,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userParam}`
            };
        } else if (userParam && typeof userParam === 'object') {
            const emailStr = userParam.email || '';
            userObj = {
                name: userParam.full_name || (emailStr.includes('@') ? emailStr.split('@')[0] : 'User'),
                email: emailStr,
                avatar: userParam.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${emailStr}`
            };
        } else {
            userObj = { name: 'User', email: '', avatar: '' };
        }
        setIsAuthenticated(true);
        setUser(userObj);
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify(userObj));
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('user');
        setActiveTab('Dashboard'); // Reset tab
    };

    if (!isMounted) {
        return null; // Prevent hydration mismatch
    }

    if (!isAuthenticated) {
        if (authView === 'login') {
            return (
                <>
                    <Toaster position="top-right" theme={currentTheme === 'light' ? 'light' : 'dark'} />
                    <Login onLogin={handleLogin} onSwitchToRegister={() => setAuthView('register')} currentTheme={currentTheme} onThemeChange={handleThemeChange} />
                </>
            );
        } else {
            return (
                <>
                    <Toaster position="top-right" theme={currentTheme === 'light' ? 'light' : 'dark'} />
                    <Register onRegister={handleRegister} onSwitchToLogin={() => setAuthView('login')} currentTheme={currentTheme} onThemeChange={handleThemeChange} />
                </>
            );
        }
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'Dashboard':
                return <Dashboard onNavigateTab={(tab) => setActiveTab(tab)} />;

            case 'Problems':
                return <Problems />;

            case 'Prioritization':
                return <Prioritization />;

            case 'Blast Radius':
                return <BlastRadius />;

            case 'AI Assistant':
                return <SecurityBot />;

            default:
                return null;
        }
    };

    return (
        <Layout activeTab={activeTab} onTabChange={setActiveTab} user={user} onLogout={handleLogout} currentTheme={currentTheme} onThemeChange={handleThemeChange}>
            <Toaster position="top-right" theme={currentTheme === 'light' ? 'light' : 'dark'} />
            {renderContent()}
        </Layout>
    );
}

export default MainApp;
