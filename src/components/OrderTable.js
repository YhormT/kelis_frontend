import { useState, useEffect, useMemo, useRef, useDeferredValue } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import {
  FileText,
  Bell,
  Check,
  SpellCheck,
  Clock,
  RotateCcw,
  CheckSquare,
} from "lucide-react";
import { Dialog } from "@headlessui/react";
import Swal from "sweetalert2";
import BASE_URL from "../endpoints/endpoints";

const TotalRequestsComponent = () => {
  const resetAllFilters = () => {
    setOrderIdFilter("");
    setPhoneNumberFilter("");
    setSelectedProduct("");
    setSelectedStatusMain("");
    setSelectedDate("");
    setStartTime("");
    setEndTime("");
    setSortOrder("newest");
    setCurrentPage(1);
    setShowNewRequestsOnly(false);
  };
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [allItems, setAllItems] = useState([]);
  const [paginatedItems, setPaginatedItems] = useState([]);

  const [newRequestsCount, setNewRequestsCount] = useState(0);
  const [lastFetchTime, setLastFetchTime] = useState(() => {
    const savedTime = localStorage.getItem("lastFetchTime");
    return savedTime ? new Date(savedTime) : null;
  });

  useEffect(() => {
    fetchOrderData();
  }, []); // Empty dependency array ensures this runs only once on mount
  const [hasNewRequests, setHasNewRequests] = useState(false);
  const [showNewRequestsOnly, setShowNewRequestsOnly] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds
  const audioRef = useRef(null);
  const [ticker, setTicker] = useState(0);

  const [orderIdFilter, setOrderIdFilter] = useState("");
  const [phoneNumberFilter, setPhoneNumberFilter] = useState("");
  // Use deferred values for instant input
  const deferredOrderIdFilter = useDeferredValue(orderIdFilter);
  const deferredPhoneNumberFilter = useDeferredValue(phoneNumberFilter);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);

  // Filters
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedStatusMain, setSelectedStatusMain] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [sortOrder, setSortOrder] = useState("newest"); // "newest" or "oldest"

  // Modal for status update
  const [isOpenStatus, setIsOpenStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  // Create a ref to track previous items count for detecting new items
  const prevOrderIdsRef = useRef(new Set());
  const intervalRef = useRef(null);

  // Request notification permission when component mounts
  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }

    // Create audio element for notification sound
    const audio = new Audio("/notification-sound.mp3"); // You'll need to add this file to your public directory
    audioRef.current = audio;

    // Clean up on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Set up auto-refresh interval effect
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (autoRefresh) {
      intervalRef.current = setInterval(fetchOrderData, refreshInterval * 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval]);

  const fetchOrderData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/order/admin/allorder`);


      const currentTime = new Date();

      // Process the data
      if (Array.isArray(response.data)) {
        const itemsList = response.data.flatMap((order) =>
          Array.isArray(order.items)
            ? order.items.map((item) => ({
                ...item,
                orderId: order.id,
                createdAt: order.createdAt,
                user: order.user,
                order: {
                  ...order,
                  items: [item], // Only include the current item to avoid status mix-ups
                },
                isNew: new Date(order.createdAt) > new Date(Date.now() - 5 * 60 * 1000),
              }))
            : []
        );

        // Check for new items since last fetch
        //const newItems = itemsList.filter(item => item.isNew).length;


        const currentOrderIds = new Set(response.data.map(order => order.id));
        const prevOrderIds = prevOrderIdsRef.current;

        // On first load, just set the initial order IDs
        if (prevOrderIds.size === 0) {
          prevOrderIdsRef.current = currentOrderIds;
        } else {
          const newOrderIds = [...currentOrderIds].filter(id => !prevOrderIds.has(id));
          const newOrdersCount = newOrderIds.length;

          if (newOrdersCount > 0) {
            setHasNewRequests(true);
            setNewRequestsCount(newOrdersCount);
            if (notificationsEnabled) {
              if ("Notification" in window && Notification.permission === "granted") {
                new Notification("New Orders", {
                  body: `${newOrdersCount} new order(s) have arrived.`,
                  icon: "/notification-icon.png",
                });
              }
              if (audioRef.current) {
                audioRef.current.play().catch(e => console.error("Error playing sound:", e));
              }
            }
          }
        }

        prevOrderIdsRef.current = currentOrderIds;
        setAllItems(itemsList);
        setLastFetchTime(currentTime);
        localStorage.setItem("lastFetchTime", currentTime.toISOString()); // Persist the time
      }
    } catch (error) {
      console.error("Error fetching order data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchOrderData();
  }, []);

  // Effect to make the 'new requests' filter dynamic
  useEffect(() => {
    let interval = null;
    if (showNewRequestsOnly) {
      interval = setInterval(() => {
        setTicker(prev => prev + 1);
      }, 10000); // Re-render every 10 seconds
    } else if (interval) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [showNewRequestsOnly]);

  // Effect to request notification permission
  useEffect(() => {
    if (notificationsEnabled && "Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, [notificationsEnabled]);

  const handleBatchCompleteProcessing = async () => {
    // Get all processing orders
    const processingItems = allItems.filter(
      (item) => item.order?.items?.[0]?.status === "Processing"
    );

    console.log("Processing Items:", processingItems);

    // If no processing orders, show a message
    if (processingItems.length === 0) {
      Swal.fire({
        icon: "info",
        title: "No Processing Orders",
        text: "There are no orders with 'Processing' status to update.",
      });
      return;
    }

    // Get unique order IDs (to prevent duplicates)
    const orderIds = [
      ...new Set(processingItems.map((item) => item.order?.id)),
    ].filter(Boolean);

    console.log("Unique Order IDs:", orderIds);

    // Confirm with the user
    const { isConfirmed } = await Swal.fire({
      icon: "question",
      title: "Batch Update",
      text: `Are you sure you want to update ${orderIds.length} orders from 'Processing' to 'Completed'?`,
      showCancelButton: true,
      confirmButtonText: "Yes, update all",
      cancelButtonText: "Cancel",
    });

    if (!isConfirmed) return;

    try {
      Swal.fire({
        title: "Processing...",
        text: `Updating ${orderIds.length} orders to "Completed" status`,
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      // Update each order
      const updatePromises = orderIds.map((orderId) =>
        axios.put(`${BASE_URL}/order/orders/${orderId}/status`, {
          status: "Completed",
        })
      );

      await Promise.all(updatePromises);

      // Update local state
      setAllItems((prevItems) =>
        prevItems.map((item) => {
          if (
            item.order?.items?.[0]?.status === "Processing" &&
            orderIds.includes(item.order?.id)
          ) {
            return {
              ...item,
              order: {
                ...item.order,
                items: item.order.items.map((orderItem) => ({
                  ...orderItem,
                  status: "Completed",
                })),
              },
            };
          }
          return item;
        })
      );

      Swal.fire({
        icon: "success",
        title: "Batch Update Complete",
        text: `${orderIds.length} orders have been updated to "Completed" status`,
        timer: 2000,
      });

      // Refresh data to ensure UI is in sync
      fetchOrderData();
    } catch (error) {
      console.error("Error updating order statuses:", error);
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: "Failed to update some order statuses. Please check the console for details.",
      });
    }
  };

  // Apply filters and memoize the result
  const filteredOrders = useMemo(() => {
    let filtered = allItems.filter((item) => {
      if (!item.createdAt) return false;

      const orderDateTime = new Date(item.createdAt);
      const orderDate = orderDateTime.toISOString().split("T")[0];

      // Dynamically filter for new requests if the toggle is on
      if (showNewRequestsOnly) {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        if (new Date(item.createdAt) < fiveMinutesAgo) {
          return false;
        }
      }

      // Filter by Order ID if specified
      if (deferredOrderIdFilter && !String(item.orderId).includes(deferredOrderIdFilter))
        return false;

      // Filter by Phone Number if specified
      if (deferredPhoneNumberFilter && !String(item.mobileNumber).includes(deferredPhoneNumberFilter))
        return false;

      const selectedStartTime = startTime
        ? new Date(`${selectedDate}T${startTime}`)
        : null;
      const selectedEndTime = endTime
        ? new Date(`${selectedDate}T${endTime}`)
        : null;

      if (selectedDate && orderDate !== selectedDate) return false;
      if (selectedProduct && item.product?.name !== selectedProduct)
        return false;

      if (startTime && endTime) {
        if (
          orderDateTime < selectedStartTime ||
          orderDateTime > selectedEndTime
        ) {
          return false;
        }
      }

      if (
        selectedStatusMain &&
        item.order?.items?.[0]?.status !== selectedStatusMain
      )
        return false;

      return true;
    });

    // Sort by creation date
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [
    allItems,
    selectedDate,
    selectedProduct,
    startTime,
    endTime,
    selectedStatusMain,
    showNewRequestsOnly,
    sortOrder,
    deferredOrderIdFilter,
    deferredPhoneNumberFilter,
    ticker,
  ]);

  // Update paginated items whenever filtered orders or page changes
  useEffect(() => {
    if (allItems.length > 0) {
      console.log("Inspecting the first item in allItems:", allItems[0]);
    }
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    setPaginatedItems(filteredOrders.slice(indexOfFirstItem, indexOfLastItem));
  }, [filteredOrders, currentPage, itemsPerPage]);

  // console.log("All Orders", paginatedItems)

  const handleViewClickStatus = (orderItemId) => {
    // Find the item to check if it's cancelled
    const item = allItems.find((item) => item.id === orderItemId);
    if (item?.order?.items?.[0]?.status === "Cancelled") {
      Swal.fire({
        icon: "warning",
        title: "Cannot Update",
        text: "Cancelled orders cannot be modified.",
      });
      return;
    }

    console.log("Order Item", orderItemId);
    setSelectedOrderId(orderItemId);
    setIsOpenStatus(true);
  };

  const handleUpdateStatus = async (orderId) => {
    try {
      Swal.fire({
        title: "Processing...",
        text: "Updating order status",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const config = {
        method: "put",
        url: `${BASE_URL}/order/orders/${orderId}/status`,
        headers: {
          "Content-Type": "application/json",
        },
        data: JSON.stringify({
          status: "Completed",
        }),
      };

      await axios.request(config);

      // Update local state to reflect the change
      setAllItems((prevItems) =>
        prevItems.map((item) =>
          item.order?.id === orderId
            ? {
                ...item,
                order: {
                  ...item.order,
                  items: item.order.items.map((orderItem) => ({
                    ...orderItem,
                    status: "Completed",
                  })),
                },
              }
            : item
        )
      );

      Swal.fire({
        icon: "success",
        title: "Status Updated",
        text: "Order status has been updated to Completed",
        timer: 2000,
      });
    } catch (error) {
      console.error("Error updating order status:", error);
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: "Failed to update order status",
      });
    }
  };

  const handleCloseModal = () => {
    const currentTime = new Date();
    setLastFetchTime(currentTime);
    localStorage.setItem("lastFetchTime", currentTime.toISOString());

    // Mark all items as not new
    setAllItems((prevItems) =>
      prevItems.map((item) => ({ ...item, isNew: false }))
    );

    setOpen(false);
    setHasNewRequests(false);
    setNewRequestsCount(0);
  };

  const handleSubmit = async () => {
    if (!selectedOrderId || !selectedStatus) {
      Swal.fire({
        icon: "warning",
        title: "Missing Information",
        text: "Please select a status before proceeding.",
      });
      return;
    }

    console.log("Selected Order ID:", selectedOrderId);

    try {
      Swal.fire({
        title: "Processing...",
        text: "Updating order status, please wait.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const response = await axios.post(
        `${BASE_URL}/order/admin/process/order`,
        {
          orderItemId: selectedOrderId,
          status: selectedStatus,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      console.log("API Response:", response.data);
      console.log("Request payload:", {
        orderItemId: selectedOrderId,
        status: selectedStatus,
      });

      setAllItems((prevItems) =>
        prevItems.map((item) =>
          item.id === selectedOrderId
            ? {
                ...item,
                order: {
                  ...item.order,
                  items: item.order.items.map((orderItem) =>
                    orderItem.id === selectedOrderId
                      ? { ...orderItem, status: selectedStatus }
                      : orderItem
                  ),
                },
                isNew: false,
              }
            : item
        )
      );

      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Order status updated successfully.",
        timer: 2000,
        showConfirmButton: false,
      });

      setIsOpenStatus(false);
    } catch (error) {
      console.error("Error updating order:", error);
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: "Something went wrong while updating the order. Please try again.",
      });
    }
  };

  const handleDownloadExcel = async () => {
    if (!filteredOrders.length) {
      Swal.fire({
        icon: "warning",
        title: "No Data",
        text: "No data to export!",
      });
      return;
    }

    // Store pending items for later update
    const pendingItems = filteredOrders.filter(
      (item) => item.order?.items?.[0]?.status === "Pending"
    );
    const pendingOrderIds = [
      ...new Set(pendingItems.map((item) => item.order?.id)),
    ].filter(Boolean);

    const dataToExport = filteredOrders.map((item) => ({
      "User Phone Number": item?.mobileNumber || "N/A",
      "Product Description": item.product?.description
        ? item.product.description.replace(/\D+$/, "")
        : "N/A",
      "New Request": item.isNew ? "Yes" : "No",
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    XLSX.writeFile(wb, "Filtered_Orders.xlsx");

    // After successful download, update the status of pending items to processing
    if (pendingOrderIds.length > 0) {
      try {
        Swal.fire({
          title: "Processing...",
          text: `Updating ${pendingOrderIds.length} pending orders to "Processing" status`,
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        // Update each pending order
        const updatePromises = pendingOrderIds.map((orderId) =>
          axios.put(`${BASE_URL}/order/orders/${orderId}/status`, {
            status: "Processing",
          })
        );

        await Promise.all(updatePromises);

        // Update local state
        setAllItems((prevItems) =>
          prevItems.map((item) => {
            if (
              item.order?.items?.[0]?.status === "Pending" &&
              pendingOrderIds.includes(item.order?.id)
            ) {
              return {
                ...item,
                order: {
                  ...item.order,
                  items: item.order.items.map((orderItem) => ({
                    ...orderItem,
                    status: "Processing",
                  })),
                },
              };
            }
            return item;
          })
        );

        Swal.fire({
          icon: "success",
          title: "Status Updated",
          text: `${pendingOrderIds.length} orders have been updated to "Processing" status`,
          timer: 2000,
        });

        // Refresh data to ensure UI is in sync
        fetchOrderData();
      } catch (error) {
        console.error("Error updating order statuses:", error);
        Swal.fire({
          icon: "error",
          title: "Update Failed",
          text: "Failed to update some order statuses. Please check the console for details.",
        });
      }
    }
  };

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleRefresh = () => {
    fetchOrderData();
    setHasNewRequests(false);
    setNewRequestsCount(0);
  };

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  // Calculate statistics
  const pendingCount = allItems.filter(
    (item) => item.order?.items?.[0]?.status === "Pending"
  ).length;
  const completedCount = allItems.filter(
    (item) => item.order?.items?.[0]?.status === "Completed"
  ).length;
  const processingCount = allItems.filter(
    (item) => item.order?.items?.[0]?.status === "Processing"
  ).length;

  return (
    <>
      <div
        className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4 w-full md:w-auto flex-1 cursor-pointer hover:shadow-lg transform hover:-translate-y-1 transition duration-300 relative"
        onClick={() => {
          resetAllFilters(); // Reset filters before opening
          setOpen(true);
          fetchOrderData();
          setHasNewRequests(false); // Turn off notification indicator
          setNewRequestsCount(0); // Reset notification count
        }}
      >
        <FileText className="w-12 h-12 text-purple-500" />
        <div>
          <h3 className="text-xl font-semibold">Total Requests</h3>
          <p className="text-lg font-bold">
            {loading ? "..." : allItems?.length}
          </p>
          {hasNewRequests && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full px-2 py-1 text-xs font-bold animate-pulse">
              New
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={open}
        onClose={handleCloseModal}
        className="fixed inset-0 flex items-center justify-center sm:justify-end bg-black bg-opacity-50 sm:pr-20"
      >
        <div className="overflow-x-auto bg-white p-6 rounded shadow-lg w-[95%] sm:w-[80%] h-[90%]">
          {/* Header with stats */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-4">
            <h2 className="text-2xl font-bold mb-2 md:mb-0">
              Requests Dashboard
            </h2>

            <div className="flex space-x-2 mb-2 md:mb-0">
              <div className="bg-blue-100 p-2 rounded-md">
                <span className="font-bold text-blue-700">{pendingCount}</span>{" "}
                Pending
              </div>
              <div className="bg-yellow-100 p-2 rounded-md">
                <span className="font-bold text-yellow-700">
                  {processingCount}
                </span>{" "}
                Processing
              </div>
              <div className="bg-green-100 p-2 rounded-md">
                <span className="font-bold text-green-700">
                  {completedCount}
                </span>{" "}
                Completed
              </div>
              {newRequestsCount > 0 && (
                <div className="bg-red-100 p-2 rounded-md animate-pulse">
                  <span className="font-bold text-red-700">
                    {newRequestsCount}
                  </span>{" "}
                  New
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleRefresh}
                className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 flex items-center"
                title="Refresh Data"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-1">
                <input
                  type="checkbox"
                  id="autoRefresh"
                  checked={autoRefresh}
                  onChange={() => setAutoRefresh(!autoRefresh)}
                  className="form-checkbox h-4 w-4 text-blue-600"
                />
                <label htmlFor="autoRefresh" className="text-sm">
                  Auto-refresh
                </label>
              </div>

              {autoRefresh && (
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="border rounded-md p-1 text-sm"
                >
                  <option value="10">10s</option>
                  <option value="30">30s</option>
                  <option value="60">1m</option>
                  <option value="300">5m</option>
                </select>
              )}

              <div className="flex items-center space-x-1">
                <input
                  type="checkbox"
                  id="notifications"
                  checked={notificationsEnabled}
                  onChange={() =>
                    setNotificationsEnabled(!notificationsEnabled)
                  }
                  className="form-checkbox h-4 w-4 text-blue-600"
                />
                <label
                  htmlFor="notifications"
                  className="text-sm flex items-center"
                >
                  <Bell className="w-4 h-4 mr-1" /> Notifications
                </label>
              </div>
            </div>
          </div>

          {/* Last updated indicator */}
          <div className="text-xs text-gray-500 mb-2 flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            Last updated:{" "}
            {lastFetchTime
              ? new Date(lastFetchTime).toLocaleTimeString()
              : "Never"}
          </div>

          {/* New Requests Toggle */}
          <div className="mb-4 flex items-center">
            <input
              type="checkbox"
              id="newRequestsToggle"
              checked={showNewRequestsOnly}
              onChange={() => {
                setShowNewRequestsOnly(!showNewRequestsOnly);
                setCurrentPage(1); // Reset to first page
              }}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
            <label htmlFor="newRequestsToggle" className="ml-2 font-medium">
              Show only new requests (last 5 minutes)
            </label>
          </div>

          <div className="overflow-x-auto w-full">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white shadow-md rounded-lg p-4 space-y-3 md:space-y-0 md:space-x-4 flex-wrap">
              {/* Order ID Filter - New Addition */}
              <div className="flex flex-col md:flex-row md:items-center space-y-1 md:space-y-0 md:space-x-3 w-full md:w-auto">
                <label
                  htmlFor="orderIdFilter"
                  className="font-medium text-gray-700"
                >
                  Order ID:
                </label>
                <input
                  type="text"
                  id="orderIdFilter"
                  value={orderIdFilter}
                  onChange={(e) => {
                    setOrderIdFilter(e.target.value);
                    setCurrentPage(1); // Reset to first page on filter change
                  }}
                  placeholder="Enter order ID"
                  className="border p-2 rounded-md w-full md:w-auto"
                />
              </div>

              {/* Phone Number Filter */}
              <div className="flex flex-col md:flex-row md:items-center space-y-1 md:space-y-0 md:space-x-3 w-full md:w-auto">
                <label
                  htmlFor="phoneNumberFilter"
                  className="font-medium text-gray-700"
                >
                  Phone:
                </label>
                <input
                  type="text"
                  id="phoneNumberFilter"
                  value={phoneNumberFilter}
                  onChange={(e) => {
                    setPhoneNumberFilter(e.target.value);
                    setCurrentPage(1); // Reset to first page on filter change
                  }}
                  placeholder="Enter phone number"
                  className="border p-2 rounded-md w-full md:w-auto"
                />
              </div>

              {/* Product Filter */}
              <div className="flex flex-col md:flex-row md:items-center space-y-1 md:space-y-0 md:space-x-3 w-full md:w-auto">
                <label
                  htmlFor="productFilter"
                  className="font-medium text-gray-700"
                >
                  Product:
                </label>
                <select
                  id="productFilter"
                  value={selectedProduct}
                  onChange={(e) => {
                    setSelectedProduct(e.target.value);
                    setCurrentPage(1); // Reset to first page on filter change
                  }}
                  className="border p-2 rounded-md w-full md:w-auto"
                >
                  <option value="">All Products</option>
                  <option value="MTN">MTN</option>
                  <option value="MTN - PREMIUM">MTN - PREMIUM</option>
                  <option value="MTN - SUPER">MTN - SUPER</option>
                  <option value="MTN - NORMAL">MTN - NORMAL</option>
                  <option value="MTN - OTHER">MTN - OTHER</option>
                  <option value="TELECEL">TELECEL</option>
                  <option value="TELECEL - PREMIUM">TELECEL - PREMIUM</option>
                  <option value="TELECEL - SUPER">TELECEL - SUPER</option>
                  <option value="TELECEL - NORMAL">TELECEL - NORMAL</option>
                  <option value="TELECEL - OTHER">TELECEL - OTHER</option>
                  <option value="AIRTEL TIGO">AIRTEL TIGO</option>
                  <option value="AIRTEL TIGO - PREMIUM">AIRTEL TIGO - PREMIUM</option>
                  <option value="AIRTEL TIGO - SUPER">AIRTEL TIGO - SUPER</option>
                  <option value="AIRTEL TIGO - NORMAL">AIRTEL TIGO - NORMAL</option>
                  <option value="AIRTEL TIGO - OTHER">AIRTEL TIGO - OTHER</option>
                </select>
              </div>

              <div className="flex flex-col md:flex-row md:items-center space-y-1 md:space-y-0 md:space-x-3 w-full md:w-auto">
                <label
                  htmlFor="statusFilter"
                  className="font-medium text-gray-700"
                >
                  Status:
                </label>
                <select
                  id="statusFilter"
                  value={selectedStatusMain}
                  onChange={(e) => {
                    setSelectedStatusMain(e.target.value);
                    setCurrentPage(1); // Reset to first page on filter change
                  }}
                  className="border p-2 rounded-md w-full md:w-auto"
                >
                  <option value="">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                  <option value="Processing">Processing</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="flex flex-col md:flex-row md:items-center space-y-1 md:space-y-0 md:space-x-3 w-full md:w-auto">
                <label
                  htmlFor="dateFilter"
                  className="font-medium text-gray-700"
                >
                  Date:
                </label>
                <input
                  type="date"
                  id="dateFilter"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setCurrentPage(1); // Reset to first page on filter change
                  }}
                  className="border p-2 rounded-md w-full md:w-auto"
                />
              </div>

              <div className="flex flex-col md:flex-row md:items-center space-y-1 md:space-y-0 md:space-x-3 w-full md:w-auto">
                <label
                  htmlFor="startTimeFilter"
                  className="font-medium text-gray-700 whitespace-nowrap"
                >
                  Start Time:
                </label>
                <input
                  type="time"
                  id="startTimeFilter"
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    setCurrentPage(1); // Reset to first page on filter change
                  }}
                  className="border p-2 rounded-md w-full md:w-auto"
                />
              </div>

              <div className="flex flex-col md:flex-row md:items-center space-y-1 md:space-y-0 md:space-x-3 w-full md:w-auto">
                <label
                  htmlFor="endTimeFilter"
                  className="font-medium text-gray-700 whitespace-nowrap"
                >
                  End Time:
                </label>
                <input
                  type="time"
                  id="endTimeFilter"
                  value={endTime}
                  onChange={(e) => {
                    setEndTime(e.target.value);
                    setCurrentPage(1); // Reset to first page on filter change
                  }}
                  className="border p-2 rounded-md w-full md:w-auto"
                />
              </div>

              <div className="flex flex-col md:flex-row md:items-center space-y-1 md:space-y-0 md:space-x-3 w-full md:w-auto">
                <label
                  htmlFor="sortOrder"
                  className="font-medium text-gray-700"
                >
                  Sort:
                </label>
                <select
                  id="sortOrder"
                  value={sortOrder}
                  onChange={(e) => {
                    setSortOrder(e.target.value);
                    setCurrentPage(1); // Reset to first page on sort change
                  }}
                  className="border p-2 rounded-md w-full md:w-auto"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              <div className="flex justify-between mt-4">
              <button
                onClick={() => setOpen(false)}
                className="bg-red-500 hover:bg-red-400 text-white px-4 py-2 rounded"
              >
                Close
              </button>
              <button
                onClick={handleBatchCompleteProcessing}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center"
                title="Mark all Processing orders as Completed"
              >
                <CheckSquare className="mr-2 w-5 h-5" />
                Complete All Processing
              </button>
              <button
                onClick={handleDownloadExcel}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                Download Excel
              </button>
            </div>

              <div className="mt-4 text-sm text-gray-600">
                Showing {paginatedItems.length} of {filteredOrders.length}{" "}
                results
              </div>

              <div className="w-full h-[400px] overflow-y-auto mt-4">
                <table className="w-full border-collapse border border-gray-300 text-sm md:text-base">
                  <thead className="bg-sky-700 text-white sticky top-0">
                    <tr>
                      <th className="border p-2 whitespace-nowrap">Order ID</th>
                      <th className="border p-2 whitespace-nowrap">Item ID</th>
                      <th className="border p-2 whitespace-nowrap">Username</th>
                      {/* <th className="border p-2 whitespace-nowrap">
                        User Phone
                      </th> */}
                      <th className="border p-2 whitespace-nowrap">
                        Phone Number
                      </th>
                      <th className="border p-2 whitespace-nowrap">Status</th>
                      <th className="border p-2 whitespace-nowrap">Name</th>
                      <th className="border p-2 whitespace-nowrap">
                        Description
                      </th>
                      <th className="border p-2 whitespace-nowrap">Date</th>
                      <th className="border p-2 whitespace-nowrap">Time</th>
                      <th className="border p-2 whitespace-nowrap">Price</th>
                      <th className="border p-2 whitespace-nowrap text-center">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedItems.length > 0 ? (
                      paginatedItems.map((item, index) => (
                        <tr
                          key={index}
                          className={`hover:bg-gray-100 ${
                            item.order?.items?.[0]?.status === "Cancelled"
                              ? "bg-red-100 text-red-800"
                              : item.isNew
                              ? "bg-green-50 animate-pulse border-l-4 border-green-500"
                              : ""
                          }`}
                        >
                          <td className="border px-2 py-2 md:px-4 relative">
                            {item.isNew && (
                              <span className="absolute left-0 top-0 h-full w-1 bg-green-500"></span>
                            )}
                            <div className="flex items-center">
                              {item.isNew && (
                                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                              )}
                              {item.orderId || "N/A"}
                              {item.isNew && (
                                <span className="ml-2 text-xs bg-green-100 text-green-800 px-1 rounded">
                                  New
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="border px-2 py-2 md:px-4">
                            {item.id || "N/A"}
                          </td>
                          <td className="border px-2 py-2 md:px-4">
                            {item.user?.name || "N/A"}
                          </td>
                          <td className="border px-2 py-2 md:px-4">
                            {item?.mobileNumber || "N/A"}
                          </td>
                          <td className="border px-2 py-2 md:px-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                item.order?.items?.[0]?.status === "Completed"
                                  ? "bg-green-100 text-green-800"
                                  : item.order?.items?.[0]?.status ===
                                    "Processing"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : item.order?.items?.[0]?.status ===
                                    "Cancelled"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {item.order?.items?.[0]?.status || "N/A"}
                            </span>
                          </td>
                          <td className="border px-2 py-2 md:px-4 whitespace-nowrap">
                            {item.product?.name || "N/A"}
                          </td>
                          <td className="border px-2 py-2 md:px-4 font-semibold">
                            {item.product?.description
                              ? item.product.description.replace(/\D+$/, "")
                              : "N/A"}{" "}
                            GB
                          </td>
                          <td className="border px-2 py-2 md:px-4 whitespace-nowrap">
                            {item.order?.createdAt
                              ? new Date(item.order.createdAt)
                                  .toISOString()
                                  .split("T")[0]
                              : "N/A"}
                          </td>
                          <td className="border px-2 py-2 md:px-4 whitespace-nowrap">
                            {item.order?.createdAt
                              ? new Date(
                                  item.order.createdAt
                                ).toLocaleTimeString()
                              : "N/A"}
                          </td>
                          <td
                            className={`border px-4 py-2 text-left whitespace-nowrap ${
                              item.order?.items?.[0]?.status === "Cancelled"
                                ? "text-red-800 font-bold" // Makes it bold and dark red if cancelled
                                : item.product?.price >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            GH₵ {item.product?.price || 0}
                          </td>

                          <td className="border px-2 py-2 md:px-4 text-center flex items-center justify-center space-x-2">
                            <button
                              className={`text-blue-500 hover:text-blue-700 mr-2 ${
                                item.isNew ? "animate-bounce" : ""
                              } ${
                                item.order?.items?.[0]?.status === "Cancelled"
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }`}
                              onClick={() => handleViewClickStatus(item.id)}
                              disabled={
                                item.order?.items?.[0]?.status === "Cancelled"
                              }
                            >
                              <SpellCheck className="w-5 h-5" />
                            </button>
                            <button
                              className={`text-green-500 hover:text-green-700 ${
                                item.isNew ? "animate-bounce" : ""
                              } ${
                                item.order?.items?.[0]?.status === "Cancelled"
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }`}
                              onClick={() => handleUpdateStatus(item.order?.id)}
                              title="Mark as Completed"
                              disabled={
                                item.order?.items?.[0]?.status === "Cancelled"
                              }
                            >
                              <Check className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="11" className="text-center p-4">
                          No items found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-4 space-x-1">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-2 py-1 rounded border ${
                  currentPage === 1
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-white hover:bg-gray-100"
                }`}
              >
                &lt;
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Logic to show pages around current page
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={i}
                    onClick={() => paginate(pageNum)}
                    className={`px-3 py-1 rounded border ${
                      currentPage === pageNum
                        ? "bg-blue-500 text-white"
                        : "bg-white hover:bg-gray-100"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className={`px-2 py-1 rounded border ${
                  currentPage === totalPages
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-white hover:bg-gray-100"
                }`}
              >
                &gt;
              </button>
            </div>
          )}
        </div>
      </Dialog>

      {/* Status update modal */}
      <Dialog
        open={isOpenStatus}
        onClose={() => setIsOpenStatus(false)}
        className="fixed inset-0 flex items-center justify-center p-4 bg-gray-900 bg-opacity-50"
      >
        <div className="bg-white p-6 rounded-lg shadow-lg w-96">
          <Dialog.Title className="text-lg font-semibold">
            Update Order Status
          </Dialog.Title>
          <Dialog.Description className="text-gray-600">
            Select a status for order <strong>#{selectedOrderId}</strong>.
          </Dialog.Description>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">
              Status:
            </label>
            <select
              className="w-full mt-2 p-2 border rounded-md"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">Select status</option>
              <option value="Processing">Processing</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="mt-4 flex justify-end space-x-2">
            <button
              className="px-4 py-2 bg-gray-300 rounded-md"
              onClick={() => setIsOpenStatus(false)}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md"
              onClick={handleSubmit}
            >
              Update
            </button>
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default TotalRequestsComponent;
