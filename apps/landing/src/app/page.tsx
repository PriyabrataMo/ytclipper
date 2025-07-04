'use client';

import React, { useState, useRef } from 'react';
import { ApiResponse, isSuccessResponse, WaitlistEntryData } from '@/lib/types';

interface FormState {
  status: 'idle' | 'loading' | 'success' | 'already_registered' | 'error';
  message: string;
}

interface ErrorDetail {
  field: string;
  message: string;
}

export default function Home() {
  const [email, setEmail] = useState('');
  const [formState, setFormState] = useState<FormState>({
    status: 'idle',
    message: '',
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);

  const handleWaitlistSubmit = async (
    e: React.FormEvent,
    source: 'landing-hero' | 'landing-bottom' | 'other'
  ) => {
    e.preventDefault();
    if (!email) return;

    setFormState({ status: 'loading', message: '' });

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          source,
        }),
      });

      const data: ApiResponse<WaitlistEntryData> = await response.json();

      if (response.ok && isSuccessResponse(data)) {
        setFormState({
          status: 'success',
          message: data.message,
        });
        setEmail('');
      } else if (!isSuccessResponse(data)) {
        // Handle different error types based on error codes
        switch (data.error.code) {
          case 'EMAIL_ALREADY_REGISTERED':
            setFormState({
              status: 'already_registered',
              message: data.error.message,
            });
            setEmail('');
            break;

          case 'RATE_LIMIT_EXCEEDED':
            setFormState({
              status: 'error',
              message:
                'Too many requests. Please wait a moment before trying again.',
            });
            break;

          case 'VALIDATION_ERROR':
            if (data.error.details && Array.isArray(data.error.details)) {
              const errorMessages = data.error.details
                .map((detail: ErrorDetail) => detail.message)
                .join(', ');
              setFormState({
                status: 'error',
                message: errorMessages,
              });
            } else {
              setFormState({
                status: 'error',
                message: data.error.message,
              });
            }
            break;

          default:
            setFormState({
              status: 'error',
              message:
                data.error.message || 'Something went wrong. Please try again.',
            });
            break;
        }
      }
    } catch (error) {
      console.error('Waitlist submission error:', error);
      setFormState({
        status: 'error',
        message: 'Network error. Please check your connection and try again.',
      });
    }
  };

  const resetForm = () => {
    setFormState({ status: 'idle', message: '' });
    setEmail('');
  };

  const renderSuccessState = (message: string, isAlreadyRegistered = false) => (
    <div
      className={`glass p-6 sm:p-8 border ${
        isAlreadyRegistered ? 'border-blue/40' : 'border-primary/40'
      } relative overflow-hidden transform transition-all duration-500 ease-out animate-in slide-in-from-bottom-4 fade-in`}
    >
      {/* Subtle background effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/2 to-transparent opacity-50"></div>

      <div className="relative z-10">
        {/* Icon with enhanced animation */}
        <div className="flex items-center justify-center mb-4">
          <div
            className={`w-16 h-16 ${
              isAlreadyRegistered
                ? 'bg-gradient-to-br from-blue to-blue/80'
                : 'bg-gradient-to-br from-primary to-accent'
            } rounded-full flex items-center justify-center shadow-xl transform transition-all duration-300 hover:scale-110`}
          >
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* Title with gradient text */}
        <h3 className="text-center text-xl sm:text-2xl font-bold mb-3 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
          {isAlreadyRegistered
            ? '🎉 Already on the list!'
            : '🚀 Welcome aboard!'}
        </h3>

        {/* Message with better typography */}
        <p className="text-white/80 text-sm sm:text-base mb-6 text-center leading-relaxed">
          {message}
        </p>

        {/* Enhanced CTA button */}
        <div className="text-center">
          <button
            onClick={resetForm}
            className="group inline-flex items-center space-x-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg backdrop-blur-sm"
          >
            <span className="text-white font-medium">
              Join with different email
            </span>
            <svg
              className="w-4 h-4 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all duration-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  const renderErrorState = (message: string) => (
    <div className="glass p-6 sm:p-8 border border-red-400/40 relative overflow-hidden transform transition-all duration-500 ease-out animate-in slide-in-from-bottom-4 fade-in">
      {/* Subtle error background */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-500/3 via-orange-500/3 to-red-500/3 opacity-70"></div>

      <div className="relative z-10">
        {/* Enhanced error icon */}
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center shadow-xl transform transition-all duration-300 hover:scale-110">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.348 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
        </div>

        {/* Error title with emoji */}
        <h3 className="text-center text-xl sm:text-2xl font-bold mb-3 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
          😔 Something went wrong
        </h3>

        {/* Error message with better styling */}
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
          <p className="text-white/90 text-sm sm:text-base text-center leading-relaxed">
            {message}
          </p>
        </div>

        {/* Enhanced retry button */}
        <div className="text-center">
          <button
            onClick={resetForm}
            className="group inline-flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary border border-primary/30 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl transform"
          >
            <svg
              className="w-4 h-4 text-white group-hover:rotate-180 transition-transform duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span className="text-white font-medium">Try again</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderFormState = () => {
    if (formState.status === 'success') {
      return renderSuccessState(formState.message);
    }

    if (formState.status === 'already_registered') {
      return renderSuccessState(formState.message, true);
    }

    if (formState.status === 'error') {
      return renderErrorState(formState.message);
    }

    // Default form state
    return (
      <form
        onSubmit={e => handleWaitlistSubmit(e, 'landing-hero')}
        className="flex flex-col gap-3 sm:gap-4"
      >
        <div className="relative group">
          <input
            ref={emailInputRef}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Enter your email for early access"
            className="input-modern w-full peer focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300 pl-11 text-white/95 font-medium tracking-wide"
            required
          />
        </div>
        <button
          type="submit"
          disabled={formState.status === 'loading'}
          className="btn-primary w-full sm:w-auto flex items-center justify-center space-x-2 min-w-[140px] disabled:opacity-50 disabled:cursor-not-allowed py-4 sm:py-3 group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
        >
          {formState.status === 'loading' ? (
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <div className="flex space-x-1">
                <div className="w-1 h-1 bg-white/70 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1 h-1 bg-white/70 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1 h-1 bg-white/70 rounded-full animate-bounce"></div>
              </div>
            </div>
          ) : (
            <>
              <span className="relative z-10">Join Waitlist</span>
              <svg
                className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200 relative z-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
              {/* Hover effect overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </>
          )}
        </button>
      </form>
    );
  };

  return (
    <div className="gradient-bg">
      {/* Navigation Header */}
      <nav className="relative z-20 flex items-center justify-between px-4 sm:px-6 py-4 sm:py-6 max-w-7xl mx-auto">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="yt-logo scale-90 sm:scale-100"></div>
          <span className="text-white font-semibold text-lg sm:text-xl tracking-tight">
            ytClipper
          </span>
        </div>

        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="hidden md:flex items-center space-x-8">
            <a
              href="#"
              className="text-white/80 hover:text-white transition-colors font-medium"
            >
              Home
            </a>
            <a
              href="#features"
              className="text-white/80 hover:text-white transition-colors font-medium"
            >
              Features
            </a>
          </div>
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white/80 hover:text-white transition-colors p-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/10 md:hidden">
            <div className="px-4 py-6 space-y-4">
              <a
                href="#"
                className="block text-white/80 hover:text-white transition-colors font-medium py-2"
              >
                Home
              </a>
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-white/80 hover:text-white transition-colors font-medium py-2"
              >
                Features
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <div className="relative">
        <div className="hero-gradient absolute inset-0"></div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-24 text-center">
          {/* Badge */}
          <div className="badge inline-flex items-center space-x-2 mb-6 sm:mb-8 text-xs sm:text-sm">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span>Coming Soon - Chrome Extension for Researchers</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold text-white mb-6 sm:mb-8 leading-[0.9] tracking-tight">
            Collect YouTube
            <br />
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Research Insights
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-lg sm:text-xl md:text-2xl text-white/70 mb-8 sm:mb-10 md:mb-12 max-w-3xl mx-auto leading-relaxed font-light px-2">
            The ultimate Chrome extension for researchers. Save timestamps,
            highlights, and notes from YouTube lectures and podcasts.
          </p>

          {/* Waitlist Form */}
          <div className="max-w-lg mx-auto mb-8 sm:mb-10 md:mb-12 px-4 sm:px-0">
            {renderFormState()}
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-8 text-white/50 text-xs sm:text-sm font-medium px-4">
            <div className="flex items-center space-x-2">
              <svg
                className="w-3 sm:w-4 h-3 sm:h-4 text-blue"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span>Secure & Private</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg
                className="w-3 sm:w-4 h-3 sm:h-4 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              <span>Built for Researchers</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg
                className="w-3 sm:w-4 h-3 sm:h-4 text-accent"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span>Free Beta Access</span>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div
        id="features"
        className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 md:py-24"
      >
        <div className="text-center mb-12 sm:mb-16 md:mb-20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6 tracking-tight px-2">
            Built for Academic Research
          </h2>
          <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto font-light px-4">
            Streamline your research workflow with intelligent timestamping and
            note-taking
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="glass p-6 sm:p-8 group transition-all duration-300 hover:scale-[1.02]">
            <div className="w-12 sm:w-14 h-12 sm:h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-primary/20 transition-all duration-300">
              <svg
                className="w-6 sm:w-7 h-6 sm:h-7 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">
              Smart Timestamps
            </h3>
            <p className="text-white/60 leading-relaxed text-sm sm:text-base">
              Capture precise moments with one click. Perfect for marking key
              insights in lectures and educational content.
            </p>
          </div>

          <div className="glass p-6 sm:p-8 group transition-all duration-300 hover:scale-[1.02]">
            <div className="w-12 sm:w-14 h-12 sm:h-14 bg-blue/10 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-blue/20 transition-all duration-300">
              <svg
                className="w-6 sm:w-7 h-6 sm:h-7 text-blue"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">
              Research Notes
            </h3>
            <p className="text-white/60 leading-relaxed text-sm sm:text-base">
              Take contextual notes linked to specific timestamps. Organize
              thoughts, citations, and insights seamlessly.
            </p>
          </div>

          <div className="glass p-6 sm:p-8 group transition-all duration-300 hover:scale-[1.02] sm:col-span-2 lg:col-span-1">
            <div className="w-12 sm:w-14 h-12 sm:h-14 bg-accent/10 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-accent/20 transition-all duration-300">
              <svg
                className="w-6 sm:w-7 h-6 sm:h-7 text-accent"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2z"
                />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">
              Research Workspace
            </h3>
            <p className="text-white/60 leading-relaxed text-sm sm:text-base">
              Sync all highlights and notes to a powerful dashboard. Search,
              organize, and export your research effortlessly.
            </p>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20 md:py-24 text-center">
        <div className="glass p-8 sm:p-10 md:p-12 border border-white/10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6 tracking-tight px-2">
            Join the Research Revolution
          </h2>
          <p className="text-lg sm:text-xl text-white/70 mb-6 sm:mb-8 max-w-2xl mx-auto font-light leading-relaxed px-2">
            Be among the first researchers to experience a new way of collecting
            insights from YouTube content.
          </p>

          {(formState.status === 'idle' ||
            formState.status === 'loading' ||
            formState.status === 'error') && (
            <form
              onSubmit={e => handleWaitlistSubmit(e, 'landing-bottom')}
              className="max-w-md mx-auto flex flex-col gap-3 sm:gap-4 px-4 sm:px-0"
            >
              <div className="relative group">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Your research email"
                  className="input-modern w-full peer focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300 pl-11 text-white/95 font-medium tracking-wide"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={formState.status === 'loading'}
                className="btn-primary w-full sm:w-auto flex items-center justify-center space-x-2 min-w-[140px] disabled:opacity-50 py-4 sm:py-3 group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
              >
                {formState.status === 'loading' ? (
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-white/70 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-1 h-1 bg-white/70 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-1 h-1 bg-white/70 rounded-full animate-bounce"></div>
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="relative z-10">Join Now</span>
                    <svg
                      className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200 relative z-10"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                    {/* Hover effect overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </>
                )}
              </button>
            </form>
          )}

          {(formState.status === 'success' ||
            formState.status === 'already_registered') && (
            <div className="max-w-md mx-auto px-4 sm:px-0">
              {formState.status === 'success' ? (
                <div className="glass p-6 sm:p-8 border border-primary/30">
                  <div className="flex items-center justify-center space-x-3 mb-3">
                    <div className="w-6 sm:w-8 h-6 sm:h-8 bg-primary rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 sm:w-5 h-4 sm:h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <span className="text-white font-semibold text-base sm:text-lg">
                      Welcome to the revolution!
                    </span>
                  </div>
                  <p className="text-white/70 text-sm sm:text-base">
                    {formState.message}
                  </p>
                </div>
              ) : (
                <div className="glass p-6 sm:p-8 border border-blue/30">
                  <div className="flex items-center justify-center space-x-3 mb-3">
                    <div className="w-6 sm:w-8 h-6 sm:h-8 bg-blue rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 sm:w-5 h-4 sm:h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <span className="text-white font-semibold text-base sm:text-lg">
                      Already with us!
                    </span>
                  </div>
                  <p className="text-white/70 text-sm sm:text-base">
                    {formState.message}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 border-t border-white/10">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="yt-logo scale-75 sm:scale-90"></div>
            <span className="text-white font-semibold text-base sm:text-lg tracking-tight">
              ytClipper
            </span>
          </div>
          <div className="flex items-center space-x-6 sm:space-x-8 text-white/50 text-xs sm:text-sm font-medium">
            <a href="#" className="hover:text-white transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Contact
            </a>
          </div>
        </div>
        <div className="mt-6 sm:mt-8 text-center text-white/40 text-xs sm:text-sm">
          © 2025 ytClipper. Building the future of research.
        </div>
      </footer>
    </div>
  );
}
