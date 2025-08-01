import { useState } from "react";
import { Dialog } from "@headlessui/react";
import { DownloadIcon, Upload, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2";
import BASE_URL from "../endpoints/endpoints";
import orderTemplate from '../assets/template/order_template.xlsx'

const UploadExcel = ({ onUploadSuccess }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [uploadResult, setUploadResult] = useState(null);
  const [errors, setErrors] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const networks = [
    { value: "MTN", label: "MTN" },
    { value: "AIRTEL TIGO", label: "Airtel Tigo" },
    { value: "TELECEL", label: "Telecel" }
  ];

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setUploadResult(null); // Reset previous results
    }
  };

  const handleNetworkChange = (event) => {
    setSelectedNetwork(event.target.value);
  };

  const resetForm = () => {
    setSelectedFile(null);
    setSelectedNetwork("");
    setUploadResult(null);
    setIsUploading(false);
  };

  const handleUpload = async () => {
    // Validation
    if (!selectedFile) {
      Swal.fire({
        icon: "warning",
        title: "No File Selected",
        text: "Please choose an Excel file to upload.",
      });
      return;
    }

    if (!selectedNetwork) {
      Swal.fire({
        icon: "warning",
        title: "Network Not Selected",
        text: "Please select a network before uploading.",
      });
      return;
    }

    const agentId = localStorage.getItem("userId");
    if (!agentId) {
      Swal.fire({
        icon: "error",
        title: "Agent ID Not Found",
        text: "Please log in before uploading orders.",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("agentId", agentId);
    formData.append("network", selectedNetwork);

    setIsUploading(true);

    try {
      const response = await axios.post(
        `${BASE_URL}/order/upload-simplified`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const result = response.data;
      setUploadResult(result);

      if (response.status === 200 && response.data.success) {
        const result = response.data;
        setUploadResult(result);
        Swal.fire({
          icon: "success",
          title: "Upload Successful",
          html: `
            <div class="text-left">
              <p><strong>Total Rows:</strong> ${result.summary.total}</p>
              <p><strong>Added to Cart:</strong> ${result.summary.successful}</p>
            </div>
          `,
        });
        if (onUploadSuccess) onUploadSuccess();
      } else {
        let errorDetails = '';
        if (result.errorReport) {
          errorDetails = `<pre style="max-height:200px;overflow:auto;background:#f8d7da;padding:8px;border-radius:4px;">${JSON.stringify(result.errorReport, null, 2)}</pre>`;
        }
        Swal.fire({
          icon: "error",
          title: "Upload Failed",
          html: `
            <div class="text-left">
              <p><strong>Total Rows:</strong> ${result.summary ? result.summary.total : 'N/A'}</p>
              <p class="text-red-600 mt-2">${result.errorReport ? 'Validation errors occurred:' : (result.message || 'Unknown error.')}</p>
              ${errorDetails}
            </div>
          `,
        });
      }

    } catch (error) {
      setUploadResult(null);
      let backendMsg = error.response?.data?.message || "An unexpected error occurred. Please try again.";
      let errorItems = error.response?.data?.errors || [];
      setErrors(errorItems);
      setUploadResult(error.response?.data || null);

      let errorHtml = `<p class='text-red-600'>${backendMsg}</p>`;
      if (errorItems.length > 0) {
        const errorList = errorItems.map(e => `<li>Row ${e.row}: ${e.errors.join(', ')}</li>`).join('');
        errorHtml += `<ul class='text-left text-sm mt-2 list-disc list-inside'>${errorList}</ul>`;
      }
      Swal.fire({
        icon: "error",
        title: "Upload Failed",
        html: errorHtml,
      });
      console.error("Upload Error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const downloadErrorReport = () => {
    if (uploadResult && uploadResult.errorReport) {
      const blob = new Blob([JSON.stringify(uploadResult.errorReport, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'upload_error_report.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <>
      {/* Upload Button */}
      <li
        className="flex items-center space-x-3 p-2 rounded-md cursor-pointer bg-blue-100 hover:bg-blue-200 border border-blue-300"
        onClick={() => setIsOpen(true)}
      >
        <Upload className="w-5 h-5 text-blue-600" />
        <span className="text-blue-800 font-medium">Upload Orders</span>
      </li>

      {/* Dialog */}
      <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex justify-center items-center p-4">
          <Dialog.Panel className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-2xl transform transition-all max-h-[90vh] overflow-y-auto">
            {/* Title */}
            <Dialog.Title className="text-xl font-semibold text-gray-800 mb-4">
              Upload Agent Orders
            </Dialog.Title>

            {/* Description */}
            <Dialog.Description className="text-sm text-gray-600 mb-6">
              Upload your orders using an Excel file. Select the network and ensure your file follows the template format.<br/>
              <span className="block mt-2 text-xs text-blue-700 font-semibold">Required Excel headers: <code>phone</code>, <code>bundle_amount</code></span>
            </Dialog.Description>

            {/* Template Download */}
            <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-medium text-green-800 mb-2">Download Template</h3>
              <p className="text-sm text-green-700 mb-3">
                Use this template to format your orders correctly.
              </p>
              <a
                href={`${BASE_URL}/order/download-simplified-template`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition text-sm"
              >
                <DownloadIcon className="h-4 w-4 mr-2" />
                Download Template
              </a>
            </div>

            {/* Network Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Network *
              </label>
              <select
                value={selectedNetwork}
                onChange={handleNetworkChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isUploading}
              >
                <option value="">Choose a network...</option>
                {networks.map((network) => (
                  <option key={network.value} value={network.value}>
                    {network.label}
                  </option>
                ))}
              </select>
            </div>

            {/* File Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choose Excel File *
              </label>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-md cursor-pointer bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600 transition"
                disabled={isUploading}
              />
            </div>

            {/* Selected File Display */}
            {selectedFile && (
              <div className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                <p className="text-sm text-blue-800 font-medium">
                  Selected: {selectedFile.name}
                </p>
                <p className="text-xs text-blue-600">
                  Size: {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            )}

            {/* Upload Result Summary */}
            {uploadResult && (
              <div className="mb-6 p-4 rounded-lg border">
                <h3 className="font-medium mb-3 flex items-center">
                  {uploadResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-500 mr-2" />
                  )}
                  Upload Summary
                </h3>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-2xl font-bold text-gray-800">
                      {uploadResult.summary.total}
                    </div>
                    <div className="text-sm text-gray-600">Total</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded">
                    <div className="text-2xl font-bold text-green-600">
                      {uploadResult.summary.successful}
                    </div>
                    <div className="text-sm text-green-600">Success</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded">
                    <div className="text-2xl font-bold text-red-600">
                      {uploadResult.summary.failed}
                    </div>
                    <div className="text-sm text-red-600">Failed</div>
                  </div>
                </div>

                {uploadResult.errors && uploadResult.errors.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-red-800 mb-2">Errors Found:</h4>
                    <div className="max-h-32 overflow-y-auto bg-red-50 p-3 rounded border border-red-200">
                      {uploadResult.errors.slice(0, 5).map((error, index) => (
                        <div key={index} className="text-sm text-red-700 mb-1">
                          Row {error.row}: {error.message}
                        </div>
                      ))}
                      {uploadResult.errors.length > 5 && (
                        <div className="text-sm text-red-600 font-medium">
                          ...and {uploadResult.errors.length - 5} more errors
                        </div>
                      )}
                    </div>
                    <button
                      onClick={downloadErrorReport}
                      className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                    >
                      Download Full Error Report
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsOpen(false);
                  resetForm();
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-400 transition"
                disabled={isUploading}
              >
                {uploadResult ? 'Close' : 'Cancel'}
              </button>
              {!uploadResult && (
                <button
                  onClick={handleUpload}
                  disabled={isUploading || !selectedFile || !selectedNetwork}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Orders
                    </>
                  )}
                </button>
              )}
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
};

export default UploadExcel;