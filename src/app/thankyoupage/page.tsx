"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../components/ProtectedRoute";

const ThankYouPage = () => {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(10);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Count down timer
    const intervalId = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    // Redirect timer
    const redirectTimer = setTimeout(() => {
      try {
        router.push("/signin");
      } catch (err) {
        setError("Navigation failed. Please use the button below.");
      }
    }, 10000);

    // Cleanup
    return () => {
      clearInterval(intervalId);
      clearTimeout(redirectTimer);
    };
  }, [router]);

  const handleManualRedirect = () => {
    try {
      router.push("/signin");
    } catch (err) {
      setError("Navigation failed. Please try again.");
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-8 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-400">
            Thank You for Participating!
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Your exam has been successfully submitted. Our team will review your
            submission and get back to you shortly.
          </p>

          {error ? (
            <div className="border-l-4 border-red-500 bg-red-100 dark:bg-red-900/30 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                    Error
                  </h3>
                  <div className="mt-1 text-sm text-red-700 dark:text-red-300">
                    {error}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-pulse text-gray-500 dark:text-gray-400">
              Redirecting to sign in page in {timeLeft} seconds...
            </div>
          )}

          <button
            onClick={handleManualRedirect}
            className="mt-4 bg-blue-600 dark:bg-blue-500 text-white px-6 py-3 rounded-lg
            hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!!error}
          >
            Return to Sign In Now
          </button>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default ThankYouPage;