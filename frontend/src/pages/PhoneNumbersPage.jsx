import React from "react";
import PhoneNumberManagement from "../components/PhoneNumberManagement";

const PhoneNumbersPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Phone Number Management
          </h1>
          <p className="mt-2 text-gray-600">
            Manage your phone numbers and connect them to assistants for
            handling calls.
          </p>
        </div>

        <PhoneNumberManagement />
      </div>
    </div>
  );
};

export default PhoneNumbersPage;
