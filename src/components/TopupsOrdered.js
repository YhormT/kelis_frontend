import { useState, useEffect, useCallback, useMemo } from "react";
import { Dialog } from "@headlessui/react";
import axios from "axios";
import {
  CheckCircle,
  Search,
  Calendar,
  Filter,
  X,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  Clock,
  ChevronLeft,
  ChevronRight,
  XCircle, // Added for reject icon
} from "lucide-react";
import Swal from "sweetalert2";
import BASE_URL from "../endpoints/endpoints";

export default function TopupsOrdered({
  justCount,
  hasNewTopups,
  setHasNewTopups,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [topups, setTopups] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds
  const [lastRefreshed, setLastRefreshed] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0, // Added rejected count to stats
  });

  const [statusFilter, setStatusFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [idFilter, setIdFilter] = useState(""); // Added ID filter
  const [startDate, setStartDate] = useState("2024-03-01");
  const [endDate, setEndDate] = useState("2030-03-14");

  const [newTopupsCount, setNewTopupsCount] = useState(0);
  const [lastTopupsTotal, setLastTopupsTotal] = useState(0);

  const fetchTopups = useCallback(async () => {
    setLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await axios.get(
        `${BASE_URL}/api/topups?startDate=${startDate}&endDate=${endDate}`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      console.log("Fetched topups:", response);

      // Check for new topups
      if (lastTopupsTotal > 0 && response.data.length > lastTopupsTotal) {
        const newCount = response.data.length - lastTopupsTotal;
        setNewTopupsCount(newCount);

        // Optionally play a sound if you want
        // const audio = new Audio('/notification-sound.mp3');
        // audio.play();
      }

      setLastTopupsTotal(response.data.length);
      setTopups(response.data);
      setLastRefreshed(new Date());

      // Calculate stats
      const approved = response.data.filter(
        (t) => t.status === "Approved"
      ).length;
      const pending = response.data.filter(
        (t) => t.status === "Pending"
      ).length;
      const rejected = response.data.filter(
        (t) => t.status === "Rejected"
      ).length;

      setStats({
        total: response.data.length,
        approved,
        pending,
        rejected,
      });
    } catch (error) {
      // Error handling code unchanged
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, lastTopupsTotal]);

  // console.log("Topups:", newTopupsCount);

  // Auto-refresh functionality
  useEffect(() => {
    let intervalId;

    if (isOpen && autoRefresh) {
      intervalId = setInterval(() => {
        fetchTopups();
      }, refreshInterval * 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isOpen, autoRefresh, refreshInterval, fetchTopups, justCount]);

  // Fetch data when modal opens

  // Memoize filtered results
  const filteredTopups = useMemo(() => {
    return topups.filter((topup) => {
      const matchesStatus =
        statusFilter === "All" || topup.status === statusFilter;

      const matchesSearch =
        !searchTerm ||
        topup.referenceId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        topup.user?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      // Added ID filter
      const matchesId =
        !idFilter ||
        topup.referenceId?.toLowerCase().includes(idFilter.toLowerCase());

      return matchesStatus && matchesSearch && matchesId;
    });
  }, [topups, statusFilter, searchTerm, idFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredTopups.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTopups.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Optimized approval handler
  const handleApprove = useCallback(
    async (topUpId) => {
      const result = await Swal.fire({
        title: "Approve Top-up?",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#10b981",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Approve",
        cancelButtonText: "Cancel",
        heightAuto: false,
        backdrop: true,
      });

      if (result.isConfirmed) {
        try {
          // Find current status before updating
          const currentStatus = topups.find((t) => t.id === topUpId)?.status;

          // Optimistic UI update
          setTopups((currentTopups) =>
            currentTopups.map((topup) =>
              topup.id === topUpId ? { ...topup, status: "Approved" } : topup
            )
          );

          // Update stats based on previous status
          setStats((prev) => {
            const newStats = { ...prev };
            if (currentStatus === "Pending") {
              newStats.pending -= 1;
            } else if (currentStatus === "Rejected") {
              newStats.rejected -= 1;
            }
            newStats.approved += 1;
            return newStats;
          });

          // API call
          await axios.patch(BASE_URL + "/api/topups/approve", {
            topUpId,
            status: "Approved",
          });

          const Toast = Swal.mixin({
            toast: true,
            position: "top-end",
            showConfirmButton: false,
            timer: 1500,
            timerProgressBar: true,
          });

          Toast.fire({
            icon: "success",
            title: "Top-up approved",
          });
        } catch (error) {
          console.error("Error approving top-up:", error);

          // Get the original status to revert to
          const originalStatus = topups.find((t) => t.id === topUpId)?.status;

          // Revert optimistic update
          setTopups((currentTopups) =>
            currentTopups.map((topup) =>
              topup.id === topUpId
                ? { ...topup, status: originalStatus }
                : topup
            )
          );

          // Revert stats
          fetchTopups(); // Refresh to get accurate stats

          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Failed to approve. Please try again.",
          });
        }
      }
    },
    [topups]
  );

  // Fixed and improved reject handler
  const handleReject = useCallback(
    async (topUpId) => {
      const result = await Swal.fire({
        title: "Reject Top-up?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Reject",
        cancelButtonText: "Cancel",
        heightAuto: false,
        backdrop: true,
      });

      if (result.isConfirmed) {
        try {
          // Find current status before updating
          const currentStatus = topups.find((t) => t.id === topUpId)?.status;

          // Optimistic UI update
          setTopups((currentTopups) =>
            currentTopups.map((topup) =>
              topup.id === topUpId ? { ...topup, status: "Rejected" } : topup
            )
          );

          // Update stats based on previous status
          setStats((prev) => {
            const newStats = { ...prev };
            if (currentStatus === "Pending") {
              newStats.pending -= 1;
            } else if (currentStatus === "Approved") {
              newStats.approved -= 1;
            }
            newStats.rejected += 1;
            return newStats;
          });

          // API call
          await axios.patch(BASE_URL + "/api/topups/approve", {
            topUpId,
            status: "Rejected",
          });

          const Toast = Swal.mixin({
            toast: true,
            position: "top-end",
            showConfirmButton: false,
            timer: 1500,
            timerProgressBar: true,
          });

          Toast.fire({
            icon: "success",
            title: "Top-up rejected",
          });
        } catch (error) {
          console.error("Error rejecting top-up:", error);

          // Get the original status to revert to
          const originalStatus = topups.find((t) => t.id === topUpId)?.status;

          // Revert optimistic update
          setTopups((currentTopups) =>
            currentTopups.map((topup) =>
              topup.id === topUpId
                ? { ...topup, status: originalStatus }
                : topup
            )
          );

          // Refresh to get accurate stats
          fetchTopups();

          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Failed to reject. Please try again.",
          });
        }
      }
    },
    [topups]
  );

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Pending":
        return "bg-blue-100 text-blue-800";
      case "Approved":
        return "bg-green-100 text-green-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "";

    const now = new Date();
    const date = new Date(timestamp);
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return `${seconds} sec ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    return date.toLocaleDateString();
  };

  const handleOpenModal = () => {
    setIsOpen(true);
    fetchTopups();
    setHasNewTopups(false); // ✅ Reset notification when user views topups
  };

  return (
    <div>
      {/* Dashboard Card */}
      <div
        onClick={handleOpenModal}
        className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between border border-gray-100 cursor-pointer hover:shadow-lg transform hover:-translate-y-1 transition duration-300"
      >
        <div className="flex items-center space-x-4">
          <div
            className={`${
              hasNewTopups ? "bg-green-100 animate-pulse" : "bg-green-50"
            } p-3 rounded-full transition-all duration-300`}
          >
            <CheckCircle
              className={`w-8 h-8 ${
                hasNewTopups ? "text-green-600" : "text-green-500"
              }`}
            />
          </div>
          <div>
            <h3 className="text-gray-500 text-sm font-medium">
              Topups Ordered
            </h3>
            <div className="flex space-x-4">
              <p className="text-2xl font-bold text-gray-800">{justCount}</p>
              {hasNewTopups && (
                <span className="flex items-center animate-pulse">
                  <span className="text-xs text-green-600 font-medium">
                    New topups!
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-gray-400" />
      </div>

      {/* Modal Dialog */}
      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-gray-200 p-3">
              <Dialog.Title className="text-lg font-semibold text-gray-800">
                Topups Management
              </Dialog.Title>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                {lastRefreshed && (
                  <span className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    Last refreshed: {formatTimeAgo(lastRefreshed)}
                  </span>
                )}
                <button
                  onClick={() => fetchTopups()}
                  className="text-blue-600 hover:text-blue-800 flex items-center"
                  disabled={loading}
                >
                  <RefreshCw
                    className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Stats Summary */}
            <div className="p-3 border-b border-gray-200 bg-gray-50">
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-gray-100 rounded-md p-2 shadow-sm">
                  <div className="text-sm text-gray-500">Total Topups</div>
                  <div className="text-xl font-bold">{stats.total}</div>
                </div>
                <div className="bg-green-100 rounded-md p-2 shadow-sm">
                  <div className="text-sm text-green-600">Approved</div>
                  <div className="text-xl font-bold text-green-600">
                    {stats.approved}
                  </div>
                </div>
                <div className="bg-blue-100 rounded-md p-2 shadow-sm">
                  <div className="text-sm text-blue-600">Pending</div>
                  <div className="text-xl font-bold text-blue-600">
                    {stats.pending}
                  </div>
                </div>
                <div className="bg-red-100 rounded-md p-2 shadow-sm">
                  <div className="text-sm text-red-600">Rejected</div>
                  <div className="text-xl font-bold text-red-600">
                    {stats.rejected}
                  </div>
                </div>
              </div>
            </div>

            {/* Auto Refresh Controls */}
            <div className="p-2 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <label className="text-xs text-gray-600 flex items-center">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={() => setAutoRefresh(!autoRefresh)}
                    className="mr-1"
                  />
                  Auto refresh
                </label>
                {autoRefresh && (
                  <select
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(Number(e.target.value))}
                    className="text-xs border border-gray-300 rounded p-1"
                  >
                    <option value={10}>Every 10s</option>
                    <option value={30}>Every 30s</option>
                    <option value={60}>Every 1m</option>
                    <option value={300}>Every 5m</option>
                  </select>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <label className="text-xs text-gray-600">
                  Show:
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1); // Reset to first page
                    }}
                    className="ml-1 border border-gray-300 rounded p-1"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </label>
              </div>
            </div>

            {/* Filters Section */}
            <div className="p-3 border-b border-gray-200 bg-gray-50">
              <div className="flex flex-wrap gap-2">
                <div className="flex-1 min-w-[120px]">
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="border border-gray-300 pl-7 py-1 rounded-md w-full text-sm"
                      aria-label="Start Date"
                    />
                  </div>
                </div>

                <div className="flex-1 min-w-[120px]">
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="border border-gray-300 pl-7 py-1 rounded-md w-full text-sm"
                      aria-label="End Date"
                    />
                  </div>
                </div>

                <div className="w-32">
                  <div className="relative">
                    <Filter className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setCurrentPage(1); // Reset to first page on filter change
                      }}
                      className="border border-gray-300 pl-7 py-1 rounded-md w-full text-sm appearance-none"
                      aria-label="Status Filter"
                    >
                      <option value="All">All</option>
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                {/* ID Filter */}
                <div className="flex-1 min-w-[150px]">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Filter by ID"
                      value={idFilter}
                      onChange={(e) => {
                        setIdFilter(e.target.value);
                        setCurrentPage(1); // Reset to first page on filter change
                      }}
                      className="border border-gray-300 pl-7 py-1 rounded-md w-full text-sm"
                    />
                  </div>
                </div>

                <div className="flex-1 min-w-[180px]">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search Customer"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1); // Reset to first page on search
                      }}
                      className="border border-gray-300 pl-7 py-1 rounded-md w-full text-sm"
                    />
                  </div>
                </div>

                <button
                  onClick={() => {
                    fetchTopups();
                    setCurrentPage(1); // Reset to first page on apply
                  }}
                  disabled={loading}
                  className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition flex items-center space-x-1 text-sm disabled:bg-blue-300"
                >
                  <Filter className="w-4 h-4" />
                  <span>Apply</span>
                </button>
              </div>
            </div>

            {/* Content Section */}
            <div className="flex-1 overflow-auto p-4">
              {/* Loading State */}
              {loading && (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              )}

              {/* Empty State */}
              {!loading && filteredTopups.length === 0 && (
                <div className="flex flex-col justify-center items-center h-32 text-center">
                  <AlertCircle className="h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">
                    No topups found. Try adjusting your filters.
                  </p>
                </div>
              )}

              {/* Table with Pagination */}
              {!loading && filteredTopups.length > 0 && (
                <div className="overflow-auto">
                  <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th
                          scope="col"
                          className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          TopUp ID
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Amount
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Customer
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Status
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Date
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Time
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentItems.map((topup, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                            {topup.referenceId}
                          </td>
                          <td
                            className={`px-4 py-2 whitespace-nowrap text-sm ${
                              topup.amount >= 0
                                ? "text-green-600 font-medium"
                                : "text-red-600 font-medium"
                            }`}
                          >
                            GH₵{" "}
                            {topup.amount.toLocaleString("en-GH", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">
                            {topup.user?.name}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">
                            <span
                              className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                                topup.status
                              )}`}
                            >
                              {topup.status}
                            </span>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                            {new Date(topup.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                            {new Date(topup.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm space-x-2">
                            {topup.status === "Pending" ? (
                              <>
                                <button
                                  onClick={() => handleApprove(topup.id)}
                                  className="bg-green-500 text-white px-2 py-1 rounded-md hover:bg-green-600 transition inline-flex items-center mr-2"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleReject(topup.id)}
                                  className="bg-red-500 text-white px-2 py-1 rounded-md hover:bg-red-600 transition inline-flex items-center"
                                >
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Reject
                                </button>
                              </>
                            ) : topup.status === "Approved" ? (
                              <span className="text-green-600 inline-flex items-center text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Approved
                              </span>
                            ) : (
                              <span className="text-red-600 inline-flex items-center text-xs">
                                <XCircle className="w-3 h-3 mr-1" />
                                Rejected
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {!loading && filteredTopups.length > 0 && (
              <div className="border-t border-gray-200 p-2 flex justify-between items-center bg-gray-50">
                <div className="text-xs text-gray-500">
                  Showing {indexOfFirstItem + 1} to{" "}
                  {Math.min(indexOfLastItem, filteredTopups.length)} of{" "}
                  {filteredTopups.length} results
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-1 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex space-x-1">
                    {/* Page numbers - show a maximum of 5 pages */}
                    {Array.from({ length: Math.min(5, totalPages) }).map(
                      (_, idx) => {
                        // Calculate the correct page number to display
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = idx + 1;
                        } else if (currentPage <= 3) {
                          pageNum = idx + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + idx;
                        } else {
                          pageNum = currentPage - 2 + idx;
                        }

                        return (
                          <button
                            key={idx}
                            onClick={() => paginate(pageNum)}
                            className={`w-6 h-6 text-xs flex items-center justify-center rounded-md ${
                              currentPage === pageNum
                                ? "bg-blue-600 text-white"
                                : "bg-gray-200 hover:bg-gray-300"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      }
                    )}
                  </div>

                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-1 rounded-md bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                >
                  Close
                </button>
              </div>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
