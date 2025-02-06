"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Lock, ArrowRight, Loader2, Laptop } from 'lucide-react';

const VALID_CREDENTIALS = {
  email: 'sriram.lnrs@gmail.com',
  password: 'sriram123'
};


const SignInPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate network delay for better UX
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (formData.email === VALID_CREDENTIALS.email && 
        formData.password === VALID_CREDENTIALS.password) {
      router.push('/home');
    } else {
      setError('Invalid email or password');
      setIsLoading(false);
    }
  };

  // Add mobile detection
    useEffect(() => {
      const checkMobile = () => {
        const isMobileDevice = window.matchMedia("(max-width: 768px)").matches;
        setIsMobile(isMobileDevice);
      };
      
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }, []);
    if (isMobile) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
          <div className="text-center text-white max-w-md">
            <h1 className="text-2xl font-bold mb-4">⚠️ Mobile Access Restricted</h1>
            <p className="text-gray-300 mb-6">
              This exam portal is not available on mobile devices. Please use a tablet or desktop computer to access the assessment.
            </p>
            <div className="flex items-center justify-center space-x-2 text-gray-400">
              <Laptop className="w-6 h-6" />
              <span>Switch to a larger device to continue</span>
            </div>
          </div>
        </div>
      );
    }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 p-4">
      <div className="relative w-full max-w-md">
        {/* Decorative background elements */}
        <div className="absolute -top-8 -left-8 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-8 -right-8 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        
        <div className="relative bg-white/95 backdrop-blur-xl p-8 rounded-2xl shadow-2xl transform transition-all duration-300 hover:scale-[1.02]">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <User className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-br from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Welcome Back
            </h2>
            <p className="text-gray-600 mt-2">Sign in to your account</p>
          </div>

          {/* Sign In Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-black"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-black"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center px-4 py-2.5 border border-transparent rounded-xl shadow-md text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </button>

            {/* Links */}
            {/* <div className="mt-6 flex items-center justify-between text-sm">
              <button type="button" className="text-blue-600 hover:text-blue-500 transition-colors">
                Forgot password?
              </button>
              <button type="button" className="text-blue-600 hover:text-blue-500 transition-colors">
                Create account
              </button>
            </div> */}
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;