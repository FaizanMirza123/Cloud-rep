import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Bot, Mail, CheckCircle, XCircle } from "lucide-react";
import {
  PageTransition,
  LoadingSpinner,
} from "../components/AnimationComponents";

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");

  const { verifyEmail } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmailToken = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setError("Invalid verification link");
        setLoading(false);
        return;
      }

      const result = await verifyEmail(token);

      if (result.success) {
        setVerified(true);
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          navigate("/dashboard");
        }, 3000);
      } else {
        setError(result.error || "Verification failed");
      }

      setLoading(false);
    };

    verifyEmailToken();
  }, [searchParams, verifyEmail, navigate]);

  if (loading) {
    return (
      <PageTransition className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col justify-center">
        <div className="sm:mx-auto sm:w-full sm:max-w-md px-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Bot className="w-9 h-9 text-white" />
            </div>
          </div>

          <h2 className="mt-6 text-center text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Verifying Email
          </h2>

          <div className="mt-8 flex justify-center">
            <LoadingSpinner
              size="large"
              text="Please wait while we verify your email..."
            />
          </div>
        </div>
      </PageTransition>
    );
  }

  if (verified) {
    return (
      <PageTransition className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col justify-center">
        <div className="sm:mx-auto sm:w-full sm:max-w-md px-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
              <CheckCircle className="w-9 h-9 text-white" />
            </div>
          </div>

          <h2 className="mt-6 text-center text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Email Verified!
          </h2>
          <p className="mt-4 text-center text-gray-600">
            Your email has been successfully verified. You will be redirected to
            your dashboard shortly.
          </p>

          <div className="mt-8 text-center">
            <Link
              to="/dashboard"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col justify-center">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
            <XCircle className="w-9 h-9 text-white" />
          </div>
        </div>

        <h2 className="mt-6 text-center text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          Verification Failed
        </h2>
        <p className="mt-4 text-center text-gray-600">{error}</p>
        <p className="mt-2 text-center text-sm text-gray-500">
          The verification link may have expired or is invalid.
        </p>

        <div className="mt-8 text-center space-y-4">
          <div>
            <Link
              to="/login"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              Back to Sign In
            </Link>
          </div>
          <div>
            <Link
              to="/register"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Create a new account
            </Link>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default EmailVerification;
