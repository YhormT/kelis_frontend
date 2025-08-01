import { useState } from "react";
import { Dialog } from "@headlessui/react";
import { ClipboardPaste, Send, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2";
import BASE_URL from "../endpoints/endpoints";

const PasteOrders = ({ onUploadSuccess }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pastedData, setPastedData] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState([]);

  const networks = [
    { value: "MTN", label: "MTN" },
    { value: "AIRTEL TIGO", label: "Airtel Tigo" },
    { value: "TELECEL", label: "Telecel" },
  ];

  const handleSubmit = async () => {
    if (!pastedData.trim()) {
      Swal.fire("Warning", "Please paste some order data.", "warning");
      return;
    }
    if (!selectedNetwork) {
      Swal.fire("Warning", "Please select a network.", "warning");
      return;
    }

    setIsUploading(true);
    setErrors([]);
    const agentId = localStorage.getItem("userId");

    try {
      const response = await axios.post(`${BASE_URL}/api/order/paste-orders`, {
        agentId,
        network: selectedNetwork,
        textData: pastedData,
      });

      Swal.fire("Success", response.data.message, "success");
      setIsOpen(false);
      setPastedData("");
      if (onUploadSuccess) onUploadSuccess();

    } catch (error) {
      const errorData = error.response?.data;
      if (errorData && errorData.errorReport) {
        setErrors(errorData.errorReport);
        Swal.fire("Upload Failed", "Validation errors occurred.", "error");
      } else {
        Swal.fire("Error", errorData?.message || "An unknown error occurred.", "error");
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-300 shadow-md"
      >
        <ClipboardPaste className="w-5 h-5 mr-2" />
        Paste Bulk Order
      </button>

      <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-lg mx-auto bg-white rounded-lg shadow-xl p-6">
            <Dialog.Title className="text-xl font-bold text-gray-800">Paste Orders</Dialog.Title>
            <p className="mt-2 text-sm text-gray-600">
              Paste phone numbers and bundle amounts below. Each entry should be on a new line, like this: <code>0244123456 50</code>
            </p>

            <div className="mt-4">
              <label htmlFor="network-select" className="block text-sm font-medium text-gray-700">Select Network</label>
              <select
                id="network-select"
                value={selectedNetwork}
                onChange={(e) => setSelectedNetwork(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="" disabled>-- Select a Network --</option>
                {networks.map((net) => (
                  <option key={net.value} value={net.value}>{net.label}</option>
                ))}
              </select>
            </div>

            <div className="mt-4">
              <label htmlFor="pasted-data" className="block text-sm font-medium text-gray-700">Phone Numbers & Bundle Amounts</label>
              <textarea
                id="pasted-data"
                rows="10"
                value={pastedData}
                onChange={(e) => setPastedData(e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="0244123456 50..."
              />
            </div>

            {errors.length > 0 && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <h3 className="text-sm font-bold text-red-800">Validation Errors</h3>
                <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                  {errors.map((err, index) => (
                    <li key={index}>Row {err.row}: {err.errors.join(', ')}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isUploading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
              >
                {isUploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Add to Cart
                  </>
                )}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
};

export default PasteOrders;
