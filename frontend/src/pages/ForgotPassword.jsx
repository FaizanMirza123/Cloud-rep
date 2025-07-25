import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Bot, Mail, ArrowLeft } from "lucide-react";
import {
  PageTransition,
  LoadingSpinner,
  ButtonHover,
} from "../components/AnimationComponents";
import { validateEmail } from "../utils/validation";
import toast from "react-hot-toast";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState("");

  const { forgotPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setError(emailValidation.error);
      return;
    }

    setLoading(true);

    const result = await forgotPassword(email);

    if (result.success) {
      setEmailSent(true);
    }

    setLoading(false);
  };

  if (emailSent) {
    return (
      <PageTransition className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col justify-center">
        <div className="sm:mx-auto sm:w-full sm:max-w-md px-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Mail className="w-9 h-9 text-white" />
            </div>
          </div>

          <h2 className="mt-6 text-center text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Check Your Email
          </h2>
          <p className="mt-4 text-center text-gray-600">
            We've sent a password reset link to <strong>{email}</strong>
          </p>
          <p className="mt-2 text-center text-sm text-gray-500">
            Check your email and click the link to reset your password. The link
            will expire in 1 hour.
          </p>

          <div className="mt-8 text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-blue-600 hover:text-blue-500 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sign In
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
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Bot className="w-9 h-9 text-white" />
          </div>
        </div>

        <h2 className="mt-6 text-center text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          Forgot Password?
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your email address and we'll send you a link to reset your
          password
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-6">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  className={`appearance-none block w-full pl-10 pr-3 py-3 border ${
                    error ? "border-red-300" : "border-gray-300"
                  } rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                  placeholder="Enter your email address"
                />
              </div>
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </div>

            <div>
              <ButtonHover
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <LoadingSpinner size="small" text="" />
                ) : (
                  "Send Reset Link"
                )}
              </ButtonHover>
            </div>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default ForgotPassword;
