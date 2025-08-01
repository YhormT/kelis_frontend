import { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { Download, DownloadIcon } from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2";
import BASE_URL from "../endpoints/endpoints";


const DownloadExcel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [tableData, setTableData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/uploads`);
        setTableData(response.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  const handleDownload = async (id, filename) => {
    try {
      const userId = parseInt(id, 10); // Ensure userId is an integer
      const url = `${BASE_URL}/api/users/download/${filename}`;

      console.log("Requesting:", url, userId);

      // Show loading alert
      Swal.fire({
        title: "Downloading...",
        text: "Please wait while your file is being downloaded.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const response = await axios.post(
        url,
        { userId },
        {
          headers: { "Content-Type": "application/json" },
          responseType: "blob", // ✅ Ensure file response
        }
      );

      if (response.status !== 200) {
        throw new Error(`Server returned status ${response.status}`);
      }

      // Hide loading and show success alert
      Swal.fire({
        title: "Download Successful!",
        text: `File "${filename}" has been downloaded successfully.`,
        icon: "success",
      });

      // Download file
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download Error:", error);

      // Show error alert
      Swal.fire({
        title: "Download Failed!",
        text: "An error occurred while downloading the file.",
        icon: "error",
      });
    }
  };

  return (
    <>
      {/* Download Button */}
      <li
        className="flex items-center space-x-3 p-2 rounded-md cursor-pointer bg-gray-700 hover:bg-gray-600"
        onClick={() => setIsOpen(true)}
      >
        <Download className="w-5 h-5" />
        <span>Download Excel</span>
      </li>

      {/* Dialog */}
      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex justify-center items-center p-4">
          <Dialog.Panel className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-2xl transform transition-all">
            <Dialog.Title className="text-xl font-semibold text-gray-800">
              Data Preview
            </Dialog.Title>

            

            {/* Data Table */}
            <div className="mt-4 overflow-x-auto">
              <div className="max-h-80 overflow-y-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-2">ID</th>
                      <th className="border border-gray-300 px-4 py-2">
                        File name
                      </th>
                      <th className="border border-gray-300 px-4 py-2">
                        Uploaded At
                      </th>
                      <th className="border border-gray-300 px-4 py-2">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-2">
                          {item.id}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {item.filename}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {new Date(item.uploadedAt).toLocaleDateString(
                            "en-GB",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          <button
                            onClick={() =>
                              handleDownload(item.userId, item.filename)
                            }
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700"
                          >
                            <DownloadIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-400 transition"
              >
                Close
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
};

export default DownloadExcel;
