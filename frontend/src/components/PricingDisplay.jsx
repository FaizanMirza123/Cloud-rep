import React, { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Info,
  Calculator,
  Lightbulb,
  Clock,
  Zap,
} from "lucide-react";
import PricingCalculator from "../utils/pricingCalculator";

const PricingDisplay = ({
  agentConfig,
  onConfigChange,
  showDetailedBreakdown = true,
  showRecommendations = true,
}) => {
  const [calculator] = useState(new PricingCalculator());
  const [costs, setCosts] = useState(null);
  const [monthlyCosts, setMonthlyCosts] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [callVolume, setCallVolume] = useState({ daily: 10, avgDuration: 5 });
  const [showCalculator, setShowCalculator] = useState(false);

  useEffect(() => {
    calculateCosts();
  }, [agentConfig, callVolume]);

  const calculateCosts = () => {
    const perMinuteCosts = calculator.calculateTotalCostPerMinute(agentConfig);
    const monthly = calculator.calculateMonthlyCosts(
      agentConfig,
      callVolume.daily,
      callVolume.avgDuration
    );
    const recs = calculator.getRecommendations(agentConfig);

    setCosts(perMinuteCosts);
    setMonthlyCosts(monthly);
    setRecommendations(recs);
  };

  const formatCurrency = (amount) => {
    if (amount < 0.01) {
      return `$${(amount * 1000).toFixed(3)}k`;
    }
    return `$${amount.toFixed(4)}`;
  };

  const formatMonthlyCurrency = (amount) => {
    if (amount > 1000) {
      return `$${(amount / 1000).toFixed(1)}k`;
    }
    return `$${amount.toFixed(2)}`;
  };

  const getComplexityColor = (complexity) => {
    switch (complexity) {
      case "simple":
        return "text-green-600 bg-green-50";
      case "moderate":
        return "text-yellow-600 bg-yellow-50";
      case "complex":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  if (!costs) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Pricing Card */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Estimated Costs
            </h3>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-xs font-medium ${getComplexityColor(
              costs.complexity
            )}`}
          >
            {costs.complexity} prompt
          </div>
        </div>

        {/* Per-minute cost */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {formatCurrency(costs.total)}
            </div>
            <div className="text-sm text-gray-600">per minute</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {formatMonthlyCurrency(monthlyCosts.monthlyCost)}
            </div>
            <div className="text-sm text-gray-600">estimated monthly</div>
            <div className="text-xs text-gray-500 mt-1">
              ({callVolume.daily} calls/day × {callVolume.avgDuration} min avg)
            </div>
          </div>
        </div>

        {/* Cost breakdown */}
        {showDetailedBreakdown && (
          <div className="bg-white rounded-lg p-4 mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Cost Breakdown (per minute)
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">VAPI Platform</span>
                <span className="text-sm font-medium">
                  {formatCurrency(costs.vapi)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  AI Model ({agentConfig.model})
                </span>
                <span className="text-sm font-medium">
                  {formatCurrency(costs.model)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Voice Synthesis</span>
                <span className="text-sm font-medium">
                  {formatCurrency(costs.voice)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Speech Recognition
                </span>
                <span className="text-sm font-medium">
                  {formatCurrency(costs.transcription)}
                </span>
              </div>
              <div className="border-t pt-2 mt-2 flex justify-between items-center font-medium">
                <span className="text-gray-900">Total</span>
                <span className="text-blue-600">
                  {formatCurrency(costs.total)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Call volume calculator */}
        <div className="mt-4">
          <button
            onClick={() => setShowCalculator(!showCalculator)}
            className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700"
          >
            <Calculator className="h-4 w-4" />
            <span>{showCalculator ? "Hide" : "Customize"} call volume</span>
          </button>

          {showCalculator && (
            <div className="mt-3 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Calls per day
                  </label>
                  <input
                    type="number"
                    value={callVolume.daily}
                    onChange={(e) =>
                      setCallVolume((prev) => ({
                        ...prev,
                        daily: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Avg call duration (min)
                  </label>
                  <input
                    type="number"
                    value={callVolume.avgDuration}
                    onChange={(e) =>
                      setCallVolume((prev) => ({
                        ...prev,
                        avgDuration: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    min="0"
                    step="0.5"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cost comparison table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-sm font-medium text-gray-900">Cost Examples</h4>
        </div>
        <div className="divide-y divide-gray-200">
          {[
            { duration: "1 min call", minutes: 1 },
            { duration: "5 min call", minutes: 5 },
            { duration: "10 min call", minutes: 10 },
            { duration: "1 hour", minutes: 60 },
          ].map(({ duration, minutes }) => (
            <div
              key={duration}
              className="px-6 py-3 flex justify-between items-center"
            >
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">{duration}</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(costs.total * minutes)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {showRecommendations && recommendations.length > 0 && (
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <div className="flex items-center space-x-2 mb-3">
            <Lightbulb className="h-5 w-5 text-yellow-600" />
            <h4 className="text-sm font-medium text-yellow-800">
              Cost Optimization Tips
            </h4>
          </div>
          <div className="space-y-2">
            {recommendations.map((rec, index) => (
              <div key={index} className="flex items-start space-x-2">
                <TrendingDown className="h-4 w-4 text-green-600 mt-0.5" />
                <div className="text-sm">
                  <p className="text-yellow-800">{rec.message}</p>
                  {rec.savings > 0 && (
                    <p className="text-green-600 font-medium">
                      Save {formatCurrency(rec.savings)}/min
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Complexity explanation */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <Info className="h-4 w-4 text-gray-500 mt-0.5" />
          <div className="text-sm text-gray-600">
            <p className="font-medium text-gray-700 mb-1">About pricing:</p>
            <ul className="space-y-1 text-xs">
              <li>• VAPI charges $0.05/minute base fee</li>
              <li>
                • Provider costs (AI model, voice, transcription) are passed
                through at cost
              </li>
              <li>• Complex prompts may increase AI model usage and costs</li>
              <li>
                • All prices are estimates and may vary based on actual usage
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingDisplay;
