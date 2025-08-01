import React, { useState, Fragment, useEffect, useRef } from "react";
import axios from "axios";
import { Dialog, Transition } from "@headlessui/react";
import Swal from "sweetalert2";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "../endpoints/endpoints";
import { BadgeCent } from "lucide-react";

const truncateMessage = (message, limit = 50) => {
  if (message.length <= limit) return message;
  return message.slice(0, limit) + "...";
};

const PaymentModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [paymentData, setPaymentData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [users, setUsers] = useState([]);
  
  const itemsPerPage = 10;
  const prevDataRef = useRef([]);

  const fetchMessages = async (showToast = false) => {
    try {
      const response = await axios.get(BASE_URL + "/api/sms/payment-received");
      const newData = response.data?.data || [];

      // Compare old vs new for new messages
      const oldIds = new Set(prevDataRef.current.map((d) => d.id));
      const newMessages = newData.filter((msg) => !oldIds.has(msg.id));

      if (newMessages.length > 0 && showToast) {
        toast.info(`🔔 ${newMessages.length} new payment message(s) received`);
      }

      setPaymentData({ data: newData });
      prevDataRef.current = newData;
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch payment messages");
    }
  };

  const handleOpenModal = async () => {
    setIsOpen(true);
    setLoading(true);
    setCurrentPage(1);
    await fetchMessages(false);
    setLoading(false);
  };

  const closeModal = () => {
    setIsOpen(false);
    setCurrentPage(1);
    setSearchTerm("");
  };

  const handleTerminate = async (smsId) => {
    const payload = {
      email: "godfrey@gmail.com",
      password: "123123456",
    };

    try {
      await axios.put(
        `${BASE_URL}/api/sms/${smsId}/mark-processed`,
        JSON.stringify(payload),
        {
          headers: {
            "Content-Type": "text/plain",
          },
        }
      );

      toast.success("Marked as processed!");

      setPaymentData((prev) => ({
        ...prev,
        data: prev.data.map((item) =>
          item.id === smsId ? { ...item, isProcessed: true } : item
        ),
      }));
    } catch (error) {
      console.error("Error terminating message:", error);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Failed to mark message as processed",
      });
    }
  };

  // Polling every 30 seconds when modal is open
  useEffect(() => {
    let intervalId;
    if (isOpen) {
      intervalId = setInterval(() => {
        fetchMessages(true);
      }, 30000);
    }
    return () => clearInterval(intervalId);
  }, [isOpen]);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/users`);
        setUsers(response.data);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  // Get filtered data
  const getFilteredData = () => {
    const data = paymentData?.data || [];
    if (!searchTerm.trim()) {
      return data;
    }
    return data.filter((item) =>
      item.reference && item.reference.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredData = getFilteredData();
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // Get current page data
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  };

  const currentData = getCurrentPageData();

  // Pagination handlers
  const goToPage = (page) => {
    console.log('Going to page:', page); // Debug log
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToFirst = () => {
    console.log('Going to first page');
    setCurrentPage(1);
  };

  const goToLast = () => {
    console.log('Going to last page:', totalPages);
    setCurrentPage(totalPages);
  };

  const goToPrevious = () => {
    console.log('Going to previous page, current:', currentPage); // Debug log
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNext = () => {
    console.log('Going to next page, current:', currentPage); // Debug log
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Generate page numbers with smart ellipsis
  const getPageNumbers = () => {
    const pages = [];
    
    if (totalPages <= 7) {
      // If total pages <= 7, show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (currentPage <= 4) {
        // Near the beginning
        for (let i = 2; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        // Near the end
        pages.push('...');
        for (let i = totalPages - 4; i < totalPages; i++) {
          pages.push(i);
        }
        pages.push(totalPages);
      } else {
        // In the middle
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <>
      <li
        className="flex items-center space-x-3 p-2 rounded-md cursor-pointer bg-gray-700 hover:bg-gray-600"
        onClick={handleOpenModal}
      >
        <BadgeCent className="w-5 h-5" />
        <div>Show Payment</div>
      </li>
      <ToastContainer />

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-30" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-5xl transform overflow-hidden rounded-xl bg-white text-left align-middle shadow-2xl transition-all">
                  <div className="p-6">
                    <Dialog.Title
                      as="h3"
                      className="text-2xl font-semibold text-gray-800 mb-4"
                    >
                      💰 Payment Received Messages
                    </Dialog.Title>

                    <div className="mb-4">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by reference..."
                        className="w-full px-4 py-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Debug Info */}
                    <div className="mb-2 text-sm text-gray-500">
                      Page {currentPage} of {totalPages} | Total: {totalItems} items | Showing: {currentData.length} items
                    </div>

                    <div>
                      {loading ? (
                        <p className="text-gray-600">Loading...</p>
                      ) : currentData.length > 0 ? (
                        <>
                          <div className="overflow-hidden border rounded-lg">
                            <div className="overflow-x-auto">
                              <table className="min-w-full text-sm">
                                <thead className="bg-gray-100 text-gray-700">
                                  <tr>
                                    <th className="px-4 py-3 text-left">Reference</th>
                                    <th className="px-4 py-3 text-left">Amount</th>
                                    <th className="px-4 py-3 text-left">Message</th>
                                    <th className="px-4 py-3 text-center">Processed</th>
                                    <th className="px-4 py-3 text-center">Action</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {currentData.map((sms) => (
                                    <tr key={sms.id}>
                                      <td className="px-4 py-2 font-medium text-gray-800">
                                        {sms.reference}
                                      </td>
                                      <td className="px-4 py-2 text-right text-green-600 font-semibold">
                                        GHS {sms.amount}.00
                                      </td>
                                      <td className="px-4 py-2 text-gray-700">
                                        <div className="relative group">
                                          {truncateMessage(sms.message)}
                                        </div>
                                      </td>
                                      <td className="px-4 py-2 text-center">
                                        {sms.isProcessed ? (
                                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                                            Yes
                                          </span>
                                        ) : (
                                          <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-semibold">
                                            No
                                          </span>
                                        )}
                                      </td>
                                      <td className="px-4 py-2 text-center">
                                        <button
                                          onClick={() => handleTerminate(sms.id)}
                                          className={`px-4 py-1 rounded-full text-sm font-medium shadow transition ${
                                            sms.isProcessed
                                              ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                                              : "bg-blue-600 hover:bg-blue-700 text-white"
                                          }`}
                                          disabled={sms.isProcessed}
                                        >
                                          Terminate
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Enhanced Pagination */}
                          {totalPages > 1 && (
                            <div className="mt-4 flex items-center justify-between bg-gray-50 px-4 py-3 border rounded">
                              <div className="text-sm text-gray-700">
                                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} results
                              </div>
                              
                              <div className="flex items-center space-x-1">
                                {/* First Button */}
                                <button
                                  onClick={goToFirst}
                                  disabled={currentPage === 1}
                                  className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  title="Go to first page"
                                >
                                  First
                                </button>

                                {/* Previous Button */}
                                <button
                                  onClick={goToPrevious}
                                  disabled={currentPage === 1}
                                  className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  title="Go to previous page"
                                >
                                  ‹
                                </button>

                                {/* Page Numbers */}
                                {pageNumbers.map((pageNum, index) => (
                                  <button
                                    key={`page-${index}-${pageNum}`}
                                    onClick={() => typeof pageNum === 'number' ? goToPage(pageNum) : null}
                                    disabled={pageNum === '...'}
                                    className={`px-3 py-1 text-sm rounded transition-colors ${
                                      currentPage === pageNum
                                        ? 'bg-blue-600 text-white font-medium'
                                        : pageNum === '...'
                                        ? 'text-gray-400 cursor-default bg-transparent'
                                        : 'bg-white border hover:bg-gray-50'
                                    }`}
                                    title={pageNum === '...' ? '' : `Go to page ${pageNum}`}
                                  >
                                    {pageNum}
                                  </button>
                                ))}

                                {/* Next Button */}
                                <button
                                  onClick={goToNext}
                                  disabled={currentPage === totalPages}
                                  className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  title="Go to next page"
                                >
                                  ›
                                </button>

                                {/* Last Button */}
                                <button
                                  onClick={goToLast}
                                  disabled={currentPage === totalPages}
                                  className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  title="Go to last page"
                                >
                                  Last
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500">
                            {searchTerm ? "No payment messages found matching your search." : "No payment messages found."}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex justify-end">
                      {/* <select
                        className="px-4 py-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Select User</option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name}
                          </option>
                        ))}
                      </select> */}
                      <button
                        type="button"
                        className="bg-red-500 text-white px-5 py-2 rounded hover:bg-red-600 transition shadow"
                        onClick={closeModal}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default PaymentModal;