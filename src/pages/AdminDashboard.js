import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import {
  Menu,
  X,
  Users,
  LogOut,
  Plus,
  User,
  CheckCircle,
  Clock,
  FileText,
  Edit,
  Trash,
  Download,
  DialogContent,
  DialogHeader,
  DialogTitle,
  View,
  SpellCheck,
  Banknote,
  BadgeCent,
  Save,
  Check,
} from "lucide-react";
import { Dialog } from "@headlessui/react";
import ProductDialog from "../components/ProductDialog";
import BASE_URL from "../endpoints/endpoints";
import TopupsOrdered from "../components/TopupsOrdered";
import Logo from "../assets/logo-icon.png";
import DownloadExcel from "../components/DownloadExcel";
import TransactionalAdminModal from "../components/TransactionalAdminModal";
import PaymentModal from "../components/PaymentModal";
import TotalRequestsComponent from "../components/OrderTable";
import Announcement from "../components/Announcement"; // New Announcement modal component
import AuditLog from "../components/AuditLog";
// import OrderDialog from "../components/OrderDialog.js";

const AdminDashboard = ({ setUserRole }) => {
  const [showAuditLog, setShowAuditLog] = useState(false);
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
const [isRefunding, setIsRefunding] = useState(false); // Prevent double refund

  const [showLoanModal, setShowLoanModal] = useState(false);
  const [orderNo, setOrderNo] = useState([]);
  // const [loanUser, setLoanUser] = useState([]);
  const [amount, setAmount] = useState("");

  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [loanAmount, setLoanAmount] = useState(""); // Loan input field
  const [hasLoan, setHasLoan] = useState(false); // Checkbox state

  const [justCount, setJustCount] = useState("");

  const sidebarRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const [hasNewTopups, setHasNewTopups] = useState(false);

  useEffect(() => {
    const fetchTopups = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          BASE_URL + "/api/topups?startDate=2024-03-01&endDate=2030-03-14"
        );

        // Check for new topups
        if (justCount > 0 && response.data.length > justCount) {
          // New topups detected!
          const newCount = response.data.length - justCount;

          // Show notification with toast
          const Toast = Swal.mixin({
            toast: true,
            position: "top-end",
            showConfirmButton: false,
            timer: 5000,
            timerProgressBar: true,
            didOpen: (toast) => {
              toast.addEventListener("mouseenter", Swal.stopTimer);
              toast.addEventListener("mouseleave", Swal.resumeTimer);
            },
          });

          Toast.fire({
            icon: "info",
            title: `${newCount} new topup${newCount > 1 ? "s" : ""} received!`,
            text: "Click on Topups Ordered to view details",
          });

          setHasNewTopups(true);
        }

        setJustCount(response.data.length);
      } catch (error) {
        console.error("Error fetching top-ups:", error);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch when component mounts
    fetchTopups();

    // Fetch data every 10 seconds
    const interval = setInterval(fetchTopups, 10000);

    // Clean up interval on component unmount
    return () => clearInterval(interval);
  }, [setUserRole, justCount]);

  const showLoan = (user) => {
    setShowLoanModal(true);
    setOrderNo(user.id);
    // setLoanUser(user);
    setLoanAmount(""); // Always start refund field blank
  };

  // Dedicated refund function to add only the refund amount to user's balance
const handleRefundAmount = async () => {
  console.log('[REFUND] Handler called');
  if (isRefunding) {
    console.log('Refund already in progress, ignoring duplicate click.');
    return;
  }
  setIsRefunding(true);
  setLoading(true);
  try {
    const refundAmount = parseFloat(loanAmount);
    // Generate a unique refund reference for idempotency
    const refundReference = `${Date.now()}_${orderNo}`;
    if (isNaN(refundAmount) || refundAmount <= 0) {
      Swal.fire({
        title: "Invalid Amount!",
        text: "Please enter a valid refund amount.",
        icon: "error",
        confirmButtonText: "OK",
      });
      setLoading(false);
      return;
    }
    // Send only the refund amount to the backend, expecting backend to increment
    const response = await axios.post(
      `${BASE_URL}/api/users/refund`,
      {
        userId: orderNo,
        amount: Number(refundAmount),
        refundReference,
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );
    Swal.fire({
      title: "Success!",
      text: "Refund successfully added to user's wallet!",
      icon: "success",
      confirmButtonText: "OK",
    });
    setLoanAmount(""); // Reset input
    fetchUsers();
    console.log('Refund successful for user:', orderNo, 'amount:', refundAmount);
  } catch (error) {
    console.error(error);
    Swal.fire({
      title: "Error!",
      text: "Failed to add refund.",
      icon: "error",
      confirmButtonText: "Try Again",
    });
  } finally {
    setLoading(false);
    setIsRefunding(false);
  }
};

// (Optional) Keep the original handleSubmitLoanAmount for other loan operations if needed.


  const [isOpenStatus, setIsOpenStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const handleViewClickStatus = (orderItemId) => {
    setSelectedOrderId(orderItemId);
    setIsOpenStatus(true);
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

    try {
      // Show loading alert
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

      console.log("Response:", response.data);

      // Show success alert
      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Order status updated successfully.",
        timer: 2000,
        showConfirmButton: false,
      });

      setIsOpenStatus(false); // Close the modal after success
    } catch (error) {
      console.error("Error updating order:", error);
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: "Something went wrong while updating the order. Please try again.",
      });
    }
  };

  const openShowModalFunc = () => {
    setShowModal(true);
    setNewUser({
      name: "",
      email: "",
      password: "",
      role: "USER",
      phone: "",
    });
    setSelectedUser(null);
    setSelectedUserTF(false);
  };

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    phone: "",
  });

 const handleInputChange = (e) => {
  const { name, value } = e.target;

  if (selectedUserTF) {
    // Editing existing user
    setSelectedUser((prev) => ({
      ...prev,
      [name]: name === "isLoggedIn" ? Boolean(value) : value,
    }));
  } else {
    // Adding new user
    setNewUser((prev) => ({
      ...prev,
      [name]: name === "isLoggedIn" ? Boolean(value) : value,
    }));
  }
};


  const generateRandomPassword = () => {
    const randomPassword = Math.random()
      .toString(36)
      .substring(2, 7)
      .toUpperCase();
    setNewUser({ ...newUser, password: randomPassword });
  };

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      console.log("New user",newUser);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "All fields are required!",
      });
      return;
    }

    try {
      const response = await axios.post(`${BASE_URL}/api/users`, newUser, {
        headers: { "Content-Type": "application/json" },
      });

      setUsers((prevUsers) => [...prevUsers, response.data]);
      setNewUser({
        name: "",
        email: "",
        password: "",
        role: "USER",
        phone: "",
      });
      setShowModal(false);

      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "User added successfully!",
      });
      fetchUsers();
    } catch (error) {
      console.error("Error adding user:", error);
      Swal.fire({
        icon: "error",
        title: "Failed!",
        text: "Failed to add user. Please try again!",
      });
    }
  };

  const [totalPending, setTotalPending] = useState(0);
  const [totalRequests, setTotalRequests] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [totalProduct, setTotalProduct] = useState(0);

  const [orders, setOrder] = useState();

  const [open, setOpen] = useState(false);

  const [orderCountItems, setOrderCountItems] = useState(0);

  const [selectedDate, setSelectedDate] = useState("");

  const [allItems, setAllItems] = useState([]);

  const [selectedOrder, setSelectedOrder] = useState(null);

  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserTF, setSelectedUserTF] = useState(false);

  const [isDialogOpenProduct, setIsDialogOpenProduct] = useState(false);

  const closeProductDialog = () => {
    setIsDialogOpenProduct(false);
  };

  const handleEditClick = (user) => {
    setSelectedUser(user); // Set user data for editing
    setShowModal(true); // Open modal
    setSelectedUserTF(true);
  };

  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 4;

  const [selectedProduct, setSelectedProduct] = useState("");

  const [selectedStatusMain, setSelectedStatusMain] = useState("");

// List of status tabs for filtering orders
const statusTabs = [
  { label: "All", value: "" },
  { label: "Processing", value: "Processing" },
  { label: "Completed", value: "Completed" },
  { label: "Canceled", value: "Canceled" }, // Added Canceled tab
];

  // Enhanced filtering: support both 'Canceled' and 'Cancelled' for status
const filteredOrders = useMemo(() => {
  return allItems.filter((item) => {
  if (!item.createdAt) return false; // Ensure createdAt exists

  const orderDateTime = new Date(item.createdAt);
  const orderDate = orderDateTime.toISOString().split("T")[0];
  const orderTime = orderDateTime.toTimeString().split(" ")[0]; // Get HH:MM:SS format

  const selectedStartTime = startTime
    ? new Date(`${selectedDate}T${startTime}`)
    : null;
  const selectedEndTime = endTime
    ? new Date(`${selectedDate}T${endTime}`)
    : null;

  if (selectedDate && orderDate !== selectedDate) return false;

  if (selectedProduct && item.product?.name !== selectedProduct) return false;

  if (startTime && endTime) {
    if (
      orderDateTime < selectedStartTime ||
      orderDateTime > selectedEndTime
    ) {
      return false;
    }
  }

  // Support both spellings for canceled status
  if (selectedStatusMain) {
    const status = item.order?.items?.[0]?.status;
    if (selectedStatusMain === "Canceled") {
      if (status !== "Canceled" && status !== "Cancelled") return false;
    } else if (status !== selectedStatusMain) {
      return false;
    }
  }

  return true;
  });
}, [allItems, selectedDate, startTime, endTime, selectedProduct, selectedStatusMain]);

  console.log("Filter", filteredOrders);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const config = {
          method: "get",
          maxBodyLength: Infinity,
          url: `${BASE_URL}/api/users`,
          headers: {},
        };
        const response = await axios.request(config);
        setUsers(response.data);
        console.log("Users:", response.data);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const config = {
        method: "get",
        maxBodyLength: Infinity,
        url: `${BASE_URL}/api/users`,
        headers: {},
      };
      const response = await axios.request(config);
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // For tracking user activity
  const [lastActivity, setLastActivity] = useState(Date.now());
  const inactivityTimeout = useRef(null);
  const INACTIVE_TIMEOUT = 300000;

  const logoutAdmin = useCallback(async () => {
    try {
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("token");

      if (userId && token) {
        // Prepare the logout API call
        const data = JSON.stringify({
          userId: parseInt(userId, 10),
        });

        const config = {
          method: "post",
          maxBodyLength: Infinity,
          url: `${BASE_URL}/api/auth/logout`,
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          data: data,
        };

        // Call the logout API
        await axios.request(config);
        console.log("User logged out successfully from server");
      }
    } catch (error) {
      console.error("Error during server logout:", error);
      // Continue with client-side logout even if server call fails
    } finally {
      // Always perform client-side cleanup
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("userId");
      setUserRole(null); // Reset state to show login screen
    }
  }, [setUserRole]);

  // Reset the timer whenever there's user activity
  const resetInactivityTimer = useCallback(() => {
    setLastActivity(Date.now());

    // Clear any existing timeout
    if (inactivityTimeout.current) {
      clearTimeout(inactivityTimeout.current);
    }

    // Set a new timeout
    inactivityTimeout.current = setTimeout(() => {
      // Show a warning before logging out
      Swal.fire({
        title: "Inactivity Detected",
        text: "You will be logged out in 1 minute due to inactivity.",
        icon: "warning",
        timer: 60000, // 1 minute warning
        showConfirmButton: true,
        confirmButtonText: "Keep me logged in",
        showCancelButton: true,
        cancelButtonText: "Logout now",
      }).then((result) => {
        if (result.isConfirmed) {
          // User clicked "Keep me logged in"
          resetInactivityTimer();
        } else {
          // User either clicked "Logout now" or the timer expired
          logoutAdmin();
        }
      });
    }, INACTIVE_TIMEOUT);
  }, [logoutAdmin]);

  // Set up event listeners for user activity
  useEffect(() => {
    // Events to monitor for activity
    const activityEvents = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    // Activity event handler
    const handleUserActivity = () => {
      resetInactivityTimer();
    };

    // Add event listeners for all activity events
    activityEvents.forEach((event) => {
      document.addEventListener(event, handleUserActivity);
    });

    // Initialize the timer when component mounts
    resetInactivityTimer();

    // Clean up event listeners when component unmounts
    return () => {
      activityEvents.forEach((event) => {
        document.removeEventListener(event, handleUserActivity);
      });

      if (inactivityTimeout.current) {
        clearTimeout(inactivityTimeout.current);
      }
    };
  }, [resetInactivityTimer]);

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "ADMIN") {
      navigate("/");
    }
  }, [navigate]);

  // Pagination Logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);

  console.log("Current Users:", currentUsers);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Export to Excel
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(users);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");
    XLSX.writeFile(wb, "users_data.xlsx");
  };

  const fetchOrderCount = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/order/admin/allorder`);
      console.log("API Response:", response.data);

      setOrder(response.data);
      setOrderCount(response.data.length);

      if (Array.isArray(response.data)) {
        const itemsList = response.data.flatMap((order) =>
          Array.isArray(order.items)
            ? order.items.map((item) => ({
                ...item,
                orderId: order.id,

                createdAt: order.createdAt,
                user: order.user,
                order,
              }))
            : []
        );

        setAllItems(itemsList);
        console.log("Flattened Items List:", itemsList);
      }
    } catch (error) {
      console.error("Error fetching order count:", error);
    }
  };

  useEffect(() => {
    fetchOrderCount();
    const interval = setInterval(fetchOrderCount, 5000);
    return () => clearInterval(interval);
  }, []);

  console.log("ALl Items", allItems);
  console.log("ALl Order", orders);

  useEffect(() => {
    const getTotalProduct = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/products`);
        setTotalProduct(response.data.length);
      } catch (error) {
        console.error("Error fetching order count:", error);
      }
    };

    getTotalProduct();
    const interval = setInterval(getTotalProduct, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleDownloadExcel = (filteredOrders) => {
    if (!filteredOrders.length) {
      alert("No data to export!");
      return;
    }

    const dataToExport = filteredOrders.map((item) => ({
      "User Phone Number": item?.mobileNumber || "N/A",
      "Product Description": item.product?.description
        ? item.product.description.replace(/\D+$/, "")
        : "N/A",
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");

    XLSX.writeFile(wb, "Filtered_Orders.xlsx");
  };

  const handleUpdateUser = async () => {
  if (!selectedUser) return;

  try {
    // Show loading alert
    Swal.fire({
      title: "Updating User...",
      text: "Please wait while we update the user information.",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    const response = await axios.put(
      `${BASE_URL}/api/users/${selectedUser.id}`,
      {
        name: selectedUser.name,
        email: selectedUser.email,
        password: selectedUser.password,
        role: selectedUser.role || "USER",
        phone: selectedUser.phone,
        isLoggedIn: selectedUser.isLoggedIn, // include this field
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Updated user:", response.data);
    
    setShowModal(false);
    fetchUsers();

    // Show success alert
    Swal.fire({
      icon: "success",
      title: "Success!",
      text: "User updated successfully!",
      timer: 2000,
      showConfirmButton: false,
    });

  } catch (error) {
    console.error("Error updating user:", error);
    
    // Show error alert
    Swal.fire({
      icon: "error",
      title: "Update Failed!",
      text: error.response?.data?.message || "Failed to update user. Please try again!",
      confirmButtonText: "Try Again",
    });
  }
};

  const handleDeleteUser = async (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`${BASE_URL}/api/users/${id}`);
          setUsers(users.filter((user) => user.id !== id));

          Swal.fire("Deleted!", "User has been deleted.", "success");
          fetchUsers();
        } catch (error) {
          console.error("Error deleting user:", error);
          Swal.fire("Error!", "Failed to delete user.", "error");
        }
      }
    });
  };

  const handleLoanStatusChange = async (userId, hasLoan) => {
    const user = users.find((u) => u.id === userId);
    if (hasLoan) {
      // Only allow checking if a valid loan amount is present
      if (!user.adminLoanBalance || user.adminLoanBalance === 0) {
        window.alert('No amount has been inputted as loan');
        // Prevent checkbox from being checked
        setUsers((prevUsers) =>
          prevUsers.map((u) =>
            u.id === userId
              ? { ...u, hasLoan: false }
              : u
          )
        );
        setEditingUserId(userId);
        setNewBalance("");
        return;
      }
    }
    // Existing logic for unchecking
    if (!hasLoan) {
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId
            ? { ...user, adminLoanBalance: 0 }
            : user
        )
      );
    }
    const { isConfirmed } = await Swal.fire({
      title: "Are you sure?",
      text: `Do you want to ${hasLoan ? "grant" : "remove"} loan status for this user?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, update it!",
    });
    if (!isConfirmed) return;
    // API request configuration
    const data = {
      userId,
      hasLoan,
      adminLoanBalance: 0, // Ensuring adminLoanBalance remains 0
    };
    const config = {
      method: "put",
      maxBodyLength: Infinity,
      url: BASE_URL + "/api/users/updateLoan/loanAmount",
      headers: { "Content-Type": "application/json" },
      data: data,
    };
    try {
      await axios.request(config);
      Swal.fire("Updated!", "Loan status has been updated.", "success");
      fetchUsers(); // Refresh users list
    } catch (error) {
      const backendMessage = error?.response?.data?.error || error.message;
      if (backendMessage && backendMessage.includes("User still has an outstanding loan and cannot be deactivated manually until loan is fully repaid")) {
        window.alert("User still has loan and cannot be deactivated manually until loan is done paying.");
      } else {
        // fallback: show error as before
        Swal.fire("Error", backendMessage, "error");
      }
    }
  };

  // Note: loanBalance is NOT modified here, only adminLoanBalance is set to zero when hasLoan is unchecked.

  const [editingUserId, setEditingUserId] = useState(null);
  const [newBalance, setNewBalance] = useState("");

// ...
  const handleEditClick1 = (user) => {
    setEditingUserId(user.id);
    setNewBalance(user.adminLoanBalance);
  };

  // In handleSaveClick, support loan assignment and repayment
  const handleSaveClick = async (userId) => {
    // Allow any non-zero number (positive or negative)
    const isValidNumber = (val) => {
      // Always convert input to string before trimming
      const trimmedVal = String(val).trim();
      const num = parseFloat(trimmedVal);
      return !isNaN(num) && num !== 0;
    };

    // Find the user in state
    const user = users.find((u) => u.id === userId);
    if (!user) {
      window.alert("User not found.");
      return;
    }

    // Handle loan operations
    if (isValidNumber(newBalance)) {
      const amount = parseFloat(newBalance);
      try {
        // If amount is negative: assign loan
        if (amount < 0) {
          // Send absolute value to backend
          const loanAmount = Math.abs(amount);
          
          // Use the loan assignment endpoint
          await axios.post(`${BASE_URL}/api/users/loan/assign`, {
            userId,
            amount: loanAmount
          });
          
          // Update UI optimistically with both balances
          setUsers((prevUsers) =>
            prevUsers.map((u) =>
              u.id === userId
                ? {
                    ...u,
                    loanBalance: (parseFloat(u.loanBalance) || 0) + loanAmount,
                    adminLoanBalance: (parseFloat(u.adminLoanBalance) || 0) + loanAmount,
                    hasLoan: true
                  }
                : u
            )
          );
          // Always fetch fresh data after loan operations to ensure UI reflects backend state
          fetchUsers();
          setTimeout(() => {
            console.log('DEBUG: Users after loan assign:', users);
          }, 1000);
          Swal.fire("Success", "Loan assigned successfully!", "success");
        }
        // If amount is positive: process repayment
        else if (amount > 0) {
          if (!user.hasLoan) {
            window.alert("This user does not have a loan");
            return;
          }
          
          // Send repayment amount to backend
          await axios.post(`${BASE_URL}/api/users/repay-loan`, {
            userId,
            amount
          });
          
          // Fetch fresh data from backend
          fetchUsers();
          setTimeout(() => {
            console.log('DEBUG: Users after loan repayment:', users);
          }, 1000);
          Swal.fire("Success", "Loan repayment processed successfully!", "success");
        }
        setEditingUserId(null);
      } catch (error) {
        console.error(error);
        Swal.fire("Error", error.response?.data?.error || "Failed to process loan operation!", "error");
      }
    } else {
      setEditingUserId(null);
      window.alert(
        "Please enter a valid non-zero number: negative for loan assignment, positive for repayment"
      );
    }
  };

  const handleUpdateStatus = async (orderId) => {
    try {
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

      const response = await axios.request(config);
      console.log(JSON.stringify(response.data));
      toast.success("Order status updated successfully!"); // Show success message

      fetchOrderCount();
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update order status!");
    }
  };

  const totalBalance = users
    .filter((user) =>
      ["USER", "PREMIUM", "SUPER", "NORMAL", "OTHER"].includes((user.role || "").toUpperCase())
    )
    .reduce((acc, user) => acc + parseFloat(user.loanBalance || 0), 0);

  return (
    <div className="flex min-h-screen min-w-full bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      {/* Sidebar Overlay for mobile */}
{isOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-40 z-40 md:hidden" onClick={() => setIsOpen(false)}></div>
)}
<aside
  className={`bg-gray-700 text-white w-64 p-5 z-50 fixed h-full transition-transform transform ${
    isOpen ? "translate-x-0" : "-translate-x-64"
  } md:translate-x-0 shadow-lg ${isOpen ? '' : 'hidden md:block'}`}
>

        <div className="flex items-center justify-between mb-5">
          {/* Image Logo */}
          <img src={Logo} height={150} width={150} />
          <button className="md:hidden" onClick={() => setIsOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav>
          <ul className="space-y-4">
            <li
              className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-700 cursor-pointer"
              onClick={() => {
                navigate("/admin/users");
                setIsOpen(false);
              }}
            >
              <Users className="w-5 h-5" />
              <span>Manage Users</span>
            </li>

            <div
              className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-700 cursor-pointer"
              onClick={() => setIsOpen(false)}
            >
              <Announcement />
            </div>

            <div
              className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-700 cursor-pointer"
              onClick={() => setIsOpen(false)}
            >
              <PaymentModal />
            </div>

            <hr />
 
            <div
              className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-700 cursor-pointer"
              onClick={() => setIsOpen(false)}
            >
              <TransactionalAdminModal />
            </div>

            <hr />
            <li
              className="flex items-center space-x-3 p-2 rounded-md hover:bg-red-700 cursor-pointer text-red-500"
              onClick={logoutAdmin}
            >
              <LogOut className="w-5 h-5" /> <span>Logout</span>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 w-full min-w-0 flex flex-col ml-0 md:ml-64">
        {/* Header */}
        <header className="bg-white shadow-md p-4 flex items-center w-full relative">
          <button className="md:hidden" onClick={() => setIsOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-base md:text-xl font-semibold flex-1 truncate">
            Admin Dashboard
          </h1>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow ml-auto"
            onClick={() => setShowAuditLog(true)}
            style={{ minWidth: 120 }}
          >
            Audit Log
          </button>
          <AuditLog isOpen={showAuditLog} onClose={() => setShowAuditLog(false)} />
        </header>

        {/* Admin Info Card */}
        <div className="p-6 w-[100%] sm:w-full">
          <div className="bg-sky-700 text-white p-5 rounded-lg shadow-md flex items-center space-x-4">
            <User className="w-10 h-10" />
            <div>
              <h2 className="text-xl font-bold">Welcome, Admin</h2>
              <p>Manage users and settings from your dashboard.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-6 px-4 sm:px-6 md:px-8 w-[100%] sm:w-full">
          {/* Total Users */}
          <div className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4 w-full md:w-auto flex-1 cursor-pointer hover:shadow-lg transform hover:-translate-y-1 transition duration-300">
            <Users className="w-12 h-12 text-blue-500" />
            <div>
              <h3 className="text-xl font-semibold">Total Users</h3>
              <p className="text-lg font-bold">{users.length}</p>
            </div>
          </div>

          {/* Topups Ordered */}
          <TopupsOrdered
            justCount={justCount}
            hasNewTopups={hasNewTopups}
            setHasNewTopups={setHasNewTopups}
          />

          {/* Total Products */}
          <div
            className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4 w-full md:w-auto flex-1 cursor-pointer hover:shadow-lg transform hover:-translate-y-1 transition duration-300"
            onClick={() => setIsDialogOpenProduct(true)}
          >
            <Clock className="w-12 h-12 text-yellow-500" />
            <div>
              <h3 className="text-xl font-semibold">Total Products</h3>
              <p className="text-lg font-bold">{totalProduct}</p>
            </div>
          </div>

          <TotalRequestsComponent />

          <div className="mt-4 text-left font-semibold text-gray-700 animate-pulse flex-nowrap">
            Total Agents Balance:{" "}
            <span className="text-green-600">
              {" "}
              GHS{" "}
              {totalBalance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>

        <ProductDialog
          isDialogOpenProduct={isDialogOpenProduct}
          setIsDialogOpenProduct={setIsDialogOpenProduct}
        />

        <main className="p-6">
          <h2 className="text-xl font-semibold mt-6">Manage Users</h2>
          <div className="md:flex block justify-between items-center">
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md mt-4 flex items-center"
              onClick={openShowModalFunc}
            >
              <Plus className="w-5 h-5 mr-2" />
            </button>
          </div>

          <div className="overflow-x-auto w-full min-w-0">
            <table className="table-auto w-full min-w-[600px] mt-4 border-collapse border border-gray-100">
              <thead>
                <tr className="bg-sky-700 text-white shadow-sm">
                  <th className="border p-2">ID</th>
                  <th className="border p-2">User Name</th>
                  <th className="border p-2">User Phone</th>
                  <th className="border p-2">Role</th>
                  <th className="border p-2 ">Balance</th>
                  <th className="border p-2">Has Loan</th>
                  <th className="border p-2">Loan</th>
                  <th className="border p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.map((user) => (
                  <tr key={user.id} className="border">
                    <td className="border p-2 text-center">0000{user.id}</td>
                    <td className="border p-2 whitespace-nowrap">
                      {user.name}
                    </td>
                    <td className="border p-2">{user.phone}</td>
                    <td className="border p-2 text-left">{user.role}</td>
                    <td className="border p-2 text-right whitespace-nowrap">
                      GHS {parseFloat(user.loanBalance).toFixed(2)}
                    </td>
                    <td className="border p-2 text-center">
                      <input
                        type="checkbox"
                        checked={user.hasLoan && parseFloat(user.adminLoanBalance) > 0}
                        onChange={(e) =>
                          handleLoanStatusChange(user.id, e.target.checked)
                        }
                        disabled={loading || !(user.hasLoan && parseFloat(user.adminLoanBalance) > 0)}
                        className="cursor-pointer text-blue-500 focus:ring-blue-500"
                      />
                    </td>
                    <td className="p-2">
                      {editingUserId === user.id ? (
                        <div className="flex items-center space-x-3 bg-white p-2 rounded-lg shadow-md border border-gray-300">
                          <input
                            type="number"
                            value={newBalance}
                            onChange={(e) => setNewBalance(e.target.value)}
                            className="border border-gray-300 rounded-md p-2 w-24 text-center focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-300"
                            placeholder="Enter Amount"
                          />
                          <button
                            onClick={() => handleSaveClick(user.id)}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-md transition-all duration-300 shadow-md flex items-center"
                          >
                            <Save className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between bg-white p-2 rounded-lg shadow-md border border-gray-300 min-w-[120px]">
                          <span className="text-gray-700 font-medium whitespace-nowrap">
                            GHS {user.adminLoanBalance}.00
                          </span>
                          <button
                            onClick={() => handleEditClick1(user)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md transition-all duration-300 shadow-md flex items-center ml-2"
                          >
                            <Banknote className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="border p-2 flex justify-center space-x-2">
                      <button
                        className="text-blue-500 hover:text-blue-700"
                        onClick={() => handleEditClick(user)}
                      >
                        <Edit className="w-5 h-5" />{" "}
                      </button>
                      <button
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash className="w-5 h-5" />{" "}
                      </button>
                      <button
                        className="text-green-500 hover:text-green-700"
                        onClick={() => showLoan(user)}
                      >
                        <Banknote className="w-5 h-5" />{" "}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-center mt-4">
              {[...Array(Math.ceil(users.length / usersPerPage)).keys()].map(
                (number) => (
                  <button
                    key={number}
                    onClick={() => paginate(number + 1)}
                    className={`px-4 py-2 mx-1 border ${
                      currentPage === number + 1
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200"
                    }`}
                  >
                    {number + 1}
                  </button>
                )
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modal for Adding User */}
      <Dialog
        open={showModal}
        onClose={() => setShowModal(false)}
        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
      >
        <div className="bg-white p-6 rounded shadow-lg w-96">
          <h2 className="text-xl font-bold mb-4">
            {selectedUserTF ? "Update User" : "Add New User"}
          </h2>

          <input
            type="text"
            name="name"
            placeholder="Name"
            value={selectedUser ? selectedUser.name : newUser.name}
            onChange={handleInputChange}
            className="w-full p-2 border rounded mb-2 uppercase"
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={selectedUser ? selectedUser.email : newUser.email}
            onChange={handleInputChange}
            className="w-full p-2 border rounded mb-2 uppercase"
          />

          <input
            type="tel"
            name="phone"
            placeholder="Phone"
            value={selectedUser ? selectedUser.phone : newUser.phone}
            onChange={handleInputChange}
            className="w-full p-2 border rounded mb-2 uppercase"
          />

          <label className="flex items-center mb-2">
            <input
              type="checkbox"
              name="isLoggedIn"
              checked={
                selectedUser ? selectedUser.isLoggedIn : newUser.isLoggedIn
              }
              onChange={(e) =>
                handleInputChange({
                  target: {
                    name: "isLoggedIn",
                    value: e.target.checked,
                  },
                })
              }
              className="mr-2"
            />
            Login
          </label>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              name="password"
              placeholder="Password"
              value={selectedUser ? selectedUser.password : newUser.password}
              onChange={handleInputChange}
              className="w-full p-2 border rounded mb-2 uppercase"
            />
            <button
              onClick={generateRandomPassword}
              className="bg-gray-300 hover:bg-gray-400 text-black px-3 py-2 rounded-full"
            >
              🔄
            </button>
          </div>

          <select
            name="role"
            value={selectedUser ? selectedUser.role : newUser.role}
            onChange={handleInputChange}
            className="w-full p-2 border rounded mb-4 uppercase"
          >
            <option value="">Select Role</option>
            <option value="ADMIN">ADMIN</option>
            <option value="USER">USER</option>
            <option value="PREMIUM">PREMIUM</option>
            <option value="SUPER">SUPER</option>
            <option value="NORMAL">NORMAL</option>
            <option value="Other">OTHER</option>
          </select>

          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setShowModal(false)}
              className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded"
            >
              Cancel
            </button>

            <button
			  onClick={selectedUserTF ? handleUpdateUser : handleAddUser}
			  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
			>
			  {selectedUserTF ? "Update" : "Add"}
			</button>
          </div>
        </div>
      </Dialog>

      {/* Dialog */}
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
              <option value="Canceled">Canceled</option>
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

      <Dialog
        open={showLoanModal}
        onClose={() => setShowLoanModal(false)}
        className="fixed inset-0 flex items-center justify-center p-4 bg-gray-900 bg-opacity-50"
      >
        <div className="bg-white p-6 rounded-lg shadow-lg w-96">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold">
              ORIGINATE REFUND
            </Dialog.Title>
            <Dialog.Description className="text-gray-600">
              ORDER <strong>#0000{orderNo}</strong>.
            </Dialog.Description>
          </div>

          <div className="mt-5">
            <strong>User ID: {orderNo}</strong>
          </div>

          <div className="mt-2">
            <label className="block text-sm font-medium text-gray-700">
              Refund Amount
            </label>
            <input
              type="number"
              value={loanAmount}
              onChange={(e) => setLoanAmount(e.target.value)}
              className="w-full mt-2 p-2 border rounded"
              placeholder="Enter refund amount"
            />
          </div>

          <div className="mt-4 flex justify-end space-x-2">
            <button
              className="px-4 py-2 bg-red-500 rounded-md"
              onClick={() => setShowLoanModal(false)}
            >
              Cancel
            </button>
            <button
               type="button"
               className="px-4 py-2 bg-blue-600 text-white rounded-md cursor-pointer hover:bg-blue-400 flex items-center space-x-1"
               onClick={handleRefundAmount}
               disabled={isRefunding || loading}
             >
               <BadgeCent className="h-5 w-5" />
               <p>pay</p>
             </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;