import { Dialog } from "@headlessui/react";
import React, { useState } from "react";
import axios from "axios";
import BASE_URL from "../endpoints/endpoints";
import { toast } from "react-toastify";

const TopUp = ({ setTopUp }) => {
  const [loading, setLoading] = useState(false);
  const [copyStatus, setCopyStatus] = useState("Copy");
  const [formData, setFormData] = useState({
    referenceId: "",
  });

  const phoneNumber = "0596316991";

  const handleCopy = () => {
    const numberToCopy = phoneNumber.replace(/\s/g, "");
    navigator.clipboard.writeText(numberToCopy).then(() => {
      setCopyStatus("Copied!");
      setTimeout(() => {
        setCopyStatus("Copy");
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      toast.error("Failed to copy number.");
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.referenceId.trim()) {
      toast.error("Please enter a valid Transaction ID.");
      return;
    }

    setLoading(true);

    try {
      const userId = localStorage.getItem("userId");

      const data = {
        userId: parseInt(userId, 10),
        referenceId: formData.referenceId,
      };

      const response = await axios.post(`${BASE_URL}/api/verify-sms`, data, {
        headers: { "Content-Type": "application/json" },
      });

      if (response.data.success) {
        // Show success toast with response data
        toast.success(
          `🎉 Top-Up Successful!\nAmount: GHS ${response.data.amount}\nNew Balance: GHS ${response.data.newBalance}\nReference: ${response.data.reference}\nTop-Up ID: ${response.data.topUpId}`,
          {
            position: "top-right",
            autoClose: 8000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          }
        );

        // Close modal and reset form
        setTopUp(false);
        setFormData({ referenceId: "" });
      } else {
        // Handle unsuccessful verification
        toast.error(
          response.data.message || "Transaction could not be verified.",
          {
            position: "top-right",
            autoClose: 5000,
          }
        );
      }
    } catch (error) {
      // Show error toast
      const errorMessage = error.response?.data?.message || "Something went wrong. Please try again.";
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center">
        <Dialog.Panel className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-2 sm:mx-auto">
          <Dialog.Title className="text-lg font-semibold mb-4">
            Verify Top Up Transaction
          </Dialog.Title>

          <div className="bottom-4 left-4 text-xs text-gray-400 bg-black backdrop-blur-sm rounded-lg p-3 border border-white/10 mb-5">
            <div className="space-y-1">
              <div className="flex items-center">
                <span className="text-cyan-400">
                  PHONE NUMBER : {phoneNumber}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="ml-2 px-2 py-1 text-xs bg-gray-200 text-black rounded hover:bg-gray-300"
                >
                  {copyStatus}
                </button>
              </div>
              <div>
                <span className="text-purple-400">
                  NAME : Yesu Yhorm Azago Kafui
                </span>
              </div>
              <div>
                <span className="text-yellow-400">PLEASE NOTE: </span>
                <p>
                  Enter your transaction ID from your mobile money payment to verify and complete your top-up.
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Transaction ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction ID
              </label>
              <input
                type="text"
                name="referenceId"
                value={formData.referenceId}
                onChange={handleChange}
                placeholder="Enter your transaction ID"
                className="w-full p-3 border rounded-md focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 outline-none"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                This is the reference number you received after making the payment
              </p>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setTopUp(false)}
                className="px-4 py-2 border border-gray-400 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </span>
                ) : (
                  "Verify & Complete"
                )}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </div>
  );
};

export default TopUp;