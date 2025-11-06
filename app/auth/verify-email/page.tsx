'use client';

import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const success = searchParams.get('success');
  const error = searchParams.get('error');
  const email = searchParams.get('email');

  const getContent = () => {
    // User just registered - show confirmation message
    if (email && !success && !error) {
      return {
        icon: '📧',
        title: 'Registration Successful!',
        message: `A verification email has been sent to ${email}. Please check your inbox and click the verification link to activate your account.`,
        color: 'green',
        showSignInButton: false,
        showResendButton: true,
      };
    }

    if (success === 'true') {
      return {
        icon: '✅',
        title: 'Email Verified Successfully!',
        message: 'Your email has been verified. You can now sign in to your account.',
        color: 'green',
        showSignInButton: true,
        showResendButton: false,
      };
    }

    if (success === 'already_verified') {
      return {
        icon: '✓',
        title: 'Email Already Verified',
        message: 'Your email address has already been verified. You can sign in to your account.',
        color: 'blue',
        showSignInButton: true,
        showResendButton: false,
      };
    }

    if (error === 'invalid_token') {
      return {
        icon: '❌',
        title: 'Invalid Verification Link',
        message: 'This verification link is invalid. It may have already been used or does not exist.',
        color: 'red',
        showSignInButton: false,
        showResendButton: false,
      };
    }

    if (error === 'expired_token') {
      return {
        icon: '⏰',
        title: 'Verification Link Expired',
        message: 'This verification link has expired. Please request a new verification email from the sign-in page.',
        color: 'yellow',
        showSignInButton: true,
        showResendButton: false,
      };
    }

    if (error === 'missing_token') {
      return {
        icon: '❓',
        title: 'Missing Verification Token',
        message: 'No verification token was provided. Please click the link from your verification email.',
        color: 'yellow',
        showSignInButton: false,
        showResendButton: false,
      };
    }

    if (error === 'user_not_found') {
      return {
        icon: '❌',
        title: 'User Not Found',
        message: 'The user associated with this verification link could not be found.',
        color: 'red',
        showSignInButton: false,
        showResendButton: false,
      };
    }

    if (error === 'server_error') {
      return {
        icon: '⚠️',
        title: 'Server Error',
        message: 'An error occurred while verifying your email. Please try again later.',
        color: 'red',
        showSignInButton: false,
        showResendButton: false,
      };
    }

    // Default state (no params - user navigated directly)
    return {
      icon: '📧',
      title: 'Email Verification',
      message: 'Please check your email for the verification link to verify your account.',
      color: 'blue',
      showSignInButton: false,
      showResendButton: false,
    };
  };

  const content = getContent();

  const colorClasses = {
    green: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-800 dark:text-green-200',
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-800 dark:text-red-200',
    },
    yellow: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      text: 'text-yellow-800 dark:text-yellow-200',
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-800 dark:text-blue-200',
    },
  };

  const colors = colorClasses[content.color as keyof typeof colorClasses];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="max-w-md w-full">
        <div className={`${colors.bg} ${colors.border} border rounded-lg p-8 shadow-lg`}>
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">{content.icon}</div>
            <h1 className={`text-2xl font-bold ${colors.text} mb-3`}>
              {content.title}
            </h1>
            <p className={`${colors.text}`}>{content.message}</p>
          </div>

          <div className="space-y-3">
            {content.showSignInButton && (
              <button
                onClick={() => router.push('/auth/signin')}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Go to Sign In
              </button>
            )}

            <button
              onClick={() => router.push('/')}
              className="w-full px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
            >
              Back to Home
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Need help?{' '}
            <a
              href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'typingtoy@444666.best'}`}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
