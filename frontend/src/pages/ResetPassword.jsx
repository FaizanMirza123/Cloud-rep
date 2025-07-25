import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Bot, Lock, Eye, EyeOff, ArrowLeft, Check } from "lucide-react";
import {
  PageTransition,
  LoadingSpinner,
  ButtonHover,
} from "../components/AnimationComponents";
import { validatePassword, getPasswordStrength } from "../utils/validation";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [token, setToken] = useState("");

  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const resetToken = searchParams.get("token");
    if (!resetToken) {
      navigate("/forgot-password");
    } else {
      setToken(resetToken);
    }
  }, [searchParams, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    // Update password strength in real-time
    if (name === "password") {
      setPasswordStrength(getPasswordStrength(value));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.errors[0];
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    const result = await resetPassword(token, formData.password);

    if (result.success) {
      navigate("/login");
    }

    setLoading(false);
  };

  const PasswordStrengthIndicator = () => {
    if (!passwordStrength || !formData.password) return null;

    return (
      <div className="mt-2">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-500">Password strength</span>
          <span className={passwordStrength.color}>
            {passwordStrength.strength}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              passwordStrength.percentage <= 20
                ? "bg-red-500"
                : passwordStrength.percentage <= 40
                ? "bg-yellow-500"
                : passwordStrength.percentage <= 60
                ? "bg-yellow-400"
                : passwordStrength.percentage <= 80
                ? "bg-green-500"
                : "bg-green-600"
            }`}
            style={{ width: `${passwordStrength.percentage}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <PageTransition className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col justify-center">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Bot className="w-9 h-9 text-white" />
          </div>
        </div>

        <h2 className="mt-6 text-center text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          Reset Password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your new password below
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-6">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`appearance-none block w-full pl-10 pr-10 py-3 border ${
                    errors.password ? "border-red-300" : "border-gray-300"
                  } rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600">{errors.password}</p>
              )}
              <PasswordStrengthIndicator />
              <div className="mt-2 text-xs text-gray-500">
                <div className="grid grid-cols-1 gap-1">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        formData.password.length >= 8
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    />
                    <span>At least 8 characters</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        /[A-Z]/.test(formData.password)
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    />
                    <span>One uppercase letter</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        /[!@#$%^&*(),.?":{}|<>]/.test(formData.password)
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    />
                    <span>One special character</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`appearance-none block w-full pl-10 pr-10 py-3 border ${
                    errors.confirmPassword
                      ? "border-red-300"
                      : "border-gray-300"
                  } rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                  placeholder="Confirm your new password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
                {formData.confirmPassword &&
                  formData.password === formData.confirmPassword && (
                    <div className="absolute inset-y-0 right-8 pr-3 flex items-center">
                      <Check className="h-5 w-5 text-green-500" />
                    </div>
                  )}
              </div>
              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.confirmPassword}
                </p>
              )}
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
                  "Reset Password"
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

export default ResetPassword;
