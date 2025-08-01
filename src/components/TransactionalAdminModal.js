import { Fragment, useEffect, useState, useMemo, useCallback } from "react";
import { Dialog, Transition } from "@headlessui/react";
import axios from "axios";
import BASE_URL from "../endpoints/endpoints";
import { ArrowRightLeft, Download, TrendingUp, TrendingDown, Users, Target, FileText, ShoppingCart, CheckCircle, XCircle, RefreshCw } from "lucide-react";

// Tabs Component
const Tabs = ({ tabs, activeTab, setActiveTab }) => (
  <div className="border-b border-gray-200">
    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 focus:outline-none ${
            activeTab === tab.id
              ? "border-indigo-500 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          {tab.name}
        </button>
      ))}
    </nav>
  </div>
);

// Virtualization hook for large lists
const useVirtualization = (items, containerHeight = 400, itemHeight = 50) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + 5, // Buffer
    items.length
  );

  const visibleItems = items.slice(visibleStart, visibleEnd);
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleStart * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll: (e) => setScrollTop(e.target.scrollTop),
  };
};

// Memoized table row component
const TransactionRow = ({ tx, index }) => {
  const isRejected =
    tx.type === "TOPUP_REJECTED" ||
    (tx.description && tx.description.includes("Top-up rejected"));

  const typeColorClass = useMemo(() => {
    const colors = {
      TOPUP_APPROVED: "bg-green-100 text-green-800",
      TOPUP_REJECTED: "bg-red-100 text-red-800",
      ORDER: "bg-blue-100 text-blue-800",
      LOAN_DEDUCTION: "bg-red-100 text-red-800",
      CART_ADD: "bg-orange-100 text-orange-800",
      CART_REMOVE: "bg-purple-100 text-purple-800",
      LOAN_STATUS: "bg-yellow-100 text-yellow-800",
      TOPUP_REQUEST: "bg-gray-100 text-gray-800",
    };
    return colors[tx.type] || "";
  }, [tx.type]);

  const rowBgClass = isRejected
    ? "bg-red-50 hover:bg-red-100"
    : index % 2 === 0
    ? "bg-white hover:bg-blue-50"
    : "bg-gray-50 hover:bg-blue-50";

  const textColorClass = isRejected
    ? "text-red-600"
    : tx.amount >= 0
    ? "text-green-600"
    : "text-red-600";

  const formatAmount = useCallback((amount) => {
    return `GH₵ ${amount.toLocaleString("en-GH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }, []);

  const formatDate = useCallback((dateString) => {
    return new Date(dateString).toLocaleString();
  }, []);

  return (
    <tr className={rowBgClass} style={{ height: "50px" }}>
      <td
        className={`border px-4 py-2 text-xs font-semibold ${typeColorClass} w-32`}
      >
        {tx.type}
      </td>
      <td className={`border px-4 py-2 ${textColorClass} w-80`}>
        {tx.description}
      </td>
      <td
        className={`border px-4 py-2 whitespace-nowrap ${textColorClass} w-32`}
      >
        {formatAmount(tx.amount)}
      </td>
      <td
        className={`border px-4 py-2 whitespace-nowrap ${
          tx.balance >= 0 ? "text-green-600" : "text-red-600"
        } w-32`}
      >
        {formatAmount(tx.balance)}
      </td>
      {["REFUND", "TOPUP_APPROVED", "ORDER", "ORDER_ITEM_STATUS"].includes(tx.type) ? (
        <td className="border px-4 py-2 whitespace-nowrap text-blue-700 w-32">
          {formatAmount(tx.previousBalance || 0)}
        </td>
      ) : (
        <td className="border px-4 py-2 whitespace-nowrap text-gray-400 w-32">
          —
        </td>
      )}
      <td
        className={`border px-4 py-2 ${isRejected ? "text-red-600" : ""} w-40`}
      >
        {tx.user?.name || "Unknown"}
      </td>
      <td
        className={`border px-4 py-2 whitespace-nowrap ${
          isRejected ? "text-red-600" : ""
        } w-48`}
      >
        {formatDate(tx.createdAt)}
      </td>
    </tr>
  );
};

// User Sales Summary Component
const UserSalesSummary = ({ userSales }) => {
  const formatAmount = (amount) =>
    `GH₵ ${amount.toLocaleString("en-GH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  return (
    <div className="bg-white border rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold mb-3 text-gray-900">
        Sales Summary by User
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left border">User</th>
              <th className="px-4 py-2 text-right border">Total Orders</th>
              <th className="px-4 py-2 text-right border">
                Total Sales Amount
              </th>
              <th className="px-4 py-2 text-right border">Avg Order Value</th>
              <th className="px-4 py-2 text-right border">Current Balance</th>
            </tr>
          </thead>
          <tbody>
            {userSales.map((user, index) => (
              <tr
                key={user.userName}
                className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
              >
                <td className="px-4 py-2 border font-medium">
                  {user.userName}
                </td>
                <td className="px-4 py-2 border text-right">
                  {user.orderCount}
                </td>
                <td className="px-4 py-2 border text-right font-semibold text-blue-600">
                  {formatAmount(Math.abs(user.totalSales))}
                </td>
                <td className="px-4 py-2 border text-right">
                  {formatAmount(Math.abs(user.totalSales / user.orderCount))}
                </td>
                <td className="px-4 py-2 border text-right">
                  {formatAmount(Math.abs(user.loanBalance))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Admin Balance Sheet Component
const AdminBalanceSheet = ({ balanceData }) => {
  const formatAmount = (amount) =>
    `GH₵ ${amount.toLocaleString("en-GH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-4">
      <h3 className="text-xl font-bold mb-4 text-gray-900 flex items-center">
        <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm mr-3">
          Admin
        </span>
        Balance Sheet Summary
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-green-200">
          <div className="text-sm text-green-800 font-medium">
            Total Revenue (Sales)
          </div>
          <div className="text-2xl font-bold text-green-600">
            {formatAmount(balanceData.totalRevenue)}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-800 font-medium">Total Top-ups</div>
          <div className="text-2xl font-bold text-blue-600">
            {formatAmount(balanceData.totalTopups)}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-teal-200">
          <div className="text-sm text-teal-800 font-medium">Total Refunds</div>
          <div className="text-2xl font-bold text-teal-600">
            {formatAmount(balanceData.totalRefunds)}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-800 font-medium whitespace-nowrap">
            Total Top-ups + Refunds
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {formatAmount(balanceData.totalTopupsAndRefunds)}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-red-200">
          <div className="text-sm text-red-800 font-medium">Total Expenses</div>
          <div className="text-2xl font-bold text-red-600">
            {formatAmount(Math.abs(balanceData.totalExpenses))}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-purple-200">
          <div className="text-sm text-purple-800 font-medium">
            Previous Balance
          </div>
          <div
            className={`text-2xl font-bold ${
              balanceData.netPosition >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {formatAmount(balanceData.previousBalance || 0)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <h4 className="font-semibold text-gray-700 mb-2">
            Transaction Breakdown
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Total Orders:</span>
              <span className="font-medium">{balanceData.orderCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Approved Top-ups:</span>
              <span className="font-medium">{balanceData.topupCount}</span>
            </div>
           <div className="flex justify-between">
              <span>Total Refunds:</span>
              <span className="font-medium text-teal-700">{balanceData.refundCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Rejected Top-ups:</span>
              <span className="font-medium text-red-600">
                {balanceData.rejectedTopupCount}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Loan Deductions:</span>
              <span className="font-medium">{balanceData.loanCount}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <h4 className="font-semibold text-gray-700 mb-2">
            Cash Flow Analysis
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Money In:</span>
              <span className="font-medium text-green-600">
                {formatAmount(balanceData.totalCredits)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Money Out:</span>
              <span className="font-medium text-red-600">
                {formatAmount(Math.abs(balanceData.totalDebits))}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-semibold">Net Cash Flow:</span>
              <span
                className={`font-bold ${
                  balanceData.netCashFlow >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {formatAmount(balanceData.netCashFlow)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <h4 className="font-semibold text-gray-700 mb-2">Key Metrics</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Avg Order Value:</span>
              <span className="font-medium">
                {balanceData.orderCount > 0
                  ? formatAmount(
                      balanceData.totalRevenue / balanceData.orderCount
                    )
                  : "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Active Users:</span>
              <span className="font-medium">{balanceData.activeUsers}</span>
            </div>
            <div className="flex justify-between">
              <span>Success Rate:</span>
              <span className="font-medium text-green-600">
                {balanceData.topupCount + balanceData.rejectedTopupCount > 0
                  ? `${(
                      (balanceData.topupCount /
                        (balanceData.topupCount +
                          balanceData.rejectedTopupCount)) *
                      100
                    ).toFixed(1)}%`
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TransactionalAdminModal = () => {
  const tabs = [
    { id: 'transactions', name: 'Transactions' },
    { id: 'sales', name: 'Sales Summary' },
    { id: 'balance', name: 'Admin Balance Sheet' },
  ];
  const [isOpen, setIsOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("transactions"); // 'transactions', 'sales', 'balance'

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [amountFilter, setAmountFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(100);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Memoized filtered and sorted transactions

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      let url = BASE_URL + "/api/transactions";
      const queryParams = [];

      if (startDate && endDate) {
        // Create proper date objects to handle time zones and full day coverage
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Set start time to beginning of day (00:00:00)
        start.setHours(0, 0, 0, 0);

        // Set end time to end of day (23:59:59.999)
        end.setHours(23, 59, 59, 999);

        // Convert to ISO strings for the API
        queryParams.push(`startDate=${start.toISOString()}`);
        queryParams.push(`endDate=${end.toISOString()}`);
      }

      if (typeFilter) {
        queryParams.push(`type=${typeFilter}`);
      }

      queryParams.push(`page=${currentPage}`);
      queryParams.push(`limit=${itemsPerPage}`);

      if (queryParams.length > 0) {
        url += "?" + queryParams.join("&");
      }

      const response = await axios.get(url);
      const data = response.data.data || [];
      setTransactions(data);
    } catch (err) {
      console.error("Failed to fetch transactions", err);
    }
    setLoading(false);
  }, [startDate, endDate, typeFilter, currentPage, itemsPerPage]);

  console.log("Fetching transactions:", transactions);

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    if (debouncedSearch) {
      filtered = filtered.filter((tx) =>
        tx.user?.name?.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }

    if (amountFilter === "positive") {
      filtered = filtered.filter((tx) => tx.amount >= 0);
    } else if (amountFilter === "negative") {
      filtered = filtered.filter((tx) => tx.amount < 0);
    }

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "date-asc":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "date-desc":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "amount-asc":
          return a.amount - b.amount;
        case "amount-desc":
          return b.amount - a.amount;
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
  }, [transactions, debouncedSearch, amountFilter, sortBy]);

  // Calculate user sales summary
  const userSalesData = useMemo(() => {
    const salesByUser = {};
    // To track latest balance per user
    const latestBalanceByUser = {};

    filteredTransactions.forEach((tx) => {
      if (tx.user?.name) {
        const userName = tx.user.name;
        // Track the latest balance for the user
        if (!latestBalanceByUser[userName] || new Date(tx.createdAt) > new Date(latestBalanceByUser[userName].createdAt)) {
          latestBalanceByUser[userName] = { balance: tx.balance || 0, createdAt: tx.createdAt };
        }
      }
      if (tx.type === "ORDER" && tx.user?.name) {
        const userName = tx.user.name;
        if (!salesByUser[userName]) {
          salesByUser[userName] = {
            userName,
            totalSales: 0,
            orderCount: 0,
            loanBalance: 0,
          };
        }
        salesByUser[userName].totalSales += tx.amount;
        salesByUser[userName].orderCount += 1;
      }
    });

    // Attach current balance (loanBalance) to each user
    Object.keys(salesByUser).forEach(userName => {
      salesByUser[userName].loanBalance = latestBalanceByUser[userName]?.balance || 0;
    });

    return Object.values(salesByUser).sort(
      (a, b) => Math.abs(b.totalSales) - Math.abs(a.totalSales)
    );
  }, [filteredTransactions]);

  // Calculate admin balance sheet data
  const adminBalanceData = useMemo(() => {
    const data = {
      totalRevenue: 0,
      totalTopups: 0,
      totalExpenses: 0,
      totalCredits: 0,
      totalDebits: 0,
      orderCount: 0,
      topupCount: 0,
      rejectedTopupCount: 0,
      loanCount: 0,
      activeUsers: new Set(),
      netPosition: 0,
      netCashFlow: 0,
      totalRefunds: 0,
      refundCount: 0,
    };

    filteredTransactions.forEach((tx) => {
      if (tx.user?.name) {
        data.activeUsers.add(tx.user.name);
      }

      if (tx.amount > 0) {
        data.totalCredits += tx.amount;
      } else {
        data.totalDebits += tx.amount;
      }

      switch (tx.type) {
        case "ORDER":
          data.totalRevenue += Math.abs(tx.amount);
          data.orderCount += 1;
          break;
        case "TOPUP_APPROVED":
          data.totalTopups += tx.amount;
          data.topupCount += 1;
          break;
        case "REFUND":
          data.totalRefunds += tx.amount;
          data.refundCount += 1;
          break;
        case "TOPUP_REJECTED":
          data.rejectedTopupCount += 1;
          break;
        case "LOAN_DEDUCTION":
          data.totalExpenses += Math.abs(tx.amount);
          data.loanCount += 1;
          break;
        case "CART_ADD":
        case "CART_REMOVE":
          data.totalExpenses += Math.abs(tx.amount);
          break;
      }
    });

    data.activeUsers = data.activeUsers.size;
    data.netPosition =
      data.totalRevenue + data.totalTopups - data.totalExpenses;
    data.netCashFlow = data.totalCredits + data.totalDebits;
    // Calculate previousBalance based on user filter and 12am cutoff
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // today at 00:00:00
    
    // Find all transactions before 12am today
    const transactionsBefore12am = transactions.filter(tx => {
      const txDate = new Date(tx.createdAt);
      return txDate < today;
    });

    if (debouncedSearch) {
      // User search is active, get the user's balance before 12am
      const userName = debouncedSearch.toLowerCase();
      const userTxs = transactionsBefore12am.filter(tx => tx.user?.name?.toLowerCase().includes(userName));
      // Get the latest transaction for the user before 12am
      const latestUserTx = userTxs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
      data.previousBalance = latestUserTx ? latestUserTx.balance : 0;
    } else {
      // No user filter, sum the latest balances of all users before 12am
      const latestByUser = {};
      transactionsBefore12am.forEach(tx => {
        const uname = tx.user?.name;
        if (!uname) return;
        if (!latestByUser[uname] || new Date(tx.createdAt) > new Date(latestByUser[uname].createdAt)) {
          latestByUser[uname] = tx;
        }
      });
      data.previousBalance = Object.values(latestByUser).reduce((sum, tx) => sum + (tx.balance || 0), 0);
    }
    data.totalTopupsAndRefunds = data.totalTopups + data.totalRefunds;

    return data;
  }, [filteredTransactions]);

  // Memoized statistics
  const stats = useMemo(() => {
    const totalCredits = filteredTransactions
      .filter((tx) => tx.amount > 0)
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalDebits = filteredTransactions
      .filter((tx) => tx.amount < 0)
      .reduce((sum, tx) => sum + tx.amount, 0);

    return {
      totalTransactions: filteredTransactions.length,
      totalCredits,
      totalDebits,
      netBalance: totalCredits + totalDebits,
    };
  }, [filteredTransactions]);

  // Virtualization for large lists
  const { visibleItems, totalHeight, offsetY, onScroll } = useVirtualization(
    filteredTransactions,
    400,
    50
  );

  const openModal = useCallback(() => {
    const today = new Date().toISOString().split("T")[0];
    setEndDate(today);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    setStartDate(thirtyDaysAgo.toISOString().split("T")[0]);

    setCurrentPage(1);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => setIsOpen(false), []);

  const handleFilter = useCallback(() => {
    setCurrentPage(1);
    fetchTransactions();
  }, [fetchTransactions]);

  const resetFilters = useCallback(() => {
    const today = new Date().toISOString().split("T")[0];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    setSearch("");
    setTypeFilter("");
    setStartDate(thirtyDaysAgo.toISOString().split("T")[0]);
    setEndDate(today);
    setAmountFilter("all");
    setSortBy("date-desc");
    setCurrentPage(1);
  }, []);

  const exportToCSV = useCallback(async () => {
    setExportLoading(true);
    try {
      let csvContent = "";

      if (activeTab === "sales") {
        // Export sales data
        const headers = [
          "User",
          "Total Orders",
          "Total Sales Amount",
          "Average Order Value",
        ];
        const rows = userSalesData.map((user) => [
          user.userName,
          user.orderCount,
          Math.abs(user.totalSales),
          Math.abs(user.totalSales / user.orderCount),
        ]);
        csvContent = [
          headers.join(","),
          ...rows.map((row) => row.join(",")),
        ].join("\n");
      } else if (activeTab === "balance") {
        // Export balance sheet data
        const headers = ["Metric", "Value"];
        const rows = [
          ["Total Revenue", adminBalanceData.totalRevenue],
          ["Total Top-ups", adminBalanceData.totalTopups],
          ["Total Expenses", Math.abs(adminBalanceData.totalExpenses)],
          ["Net Position", adminBalanceData.netPosition],
          ["Total Orders", adminBalanceData.orderCount],
          ["Active Users", adminBalanceData.activeUsers],
          [
            "Success Rate (%)",
            adminBalanceData.topupCount + adminBalanceData.rejectedTopupCount >
            0
              ? (
                  (adminBalanceData.topupCount /
                    (adminBalanceData.topupCount +
                      adminBalanceData.rejectedTopupCount)) *
                  100
                ).toFixed(1)
              : 0,
          ],
        ];
        csvContent = [
          headers.join(","),
          ...rows.map((row) => row.join(",")),
        ].join("\n");
      } else {
        // Export transaction data
        const headers = [
          "Type",
          "Description",
          "Amount",
          "Balance",
          "User",
          "Date",
        ];
        const rows = filteredTransactions.map((tx) => [
          tx.type,
          `"${tx.description || ""}"`,
          tx.amount,
          tx.balance,
          tx.user?.name || "Unknown",
          new Date(tx.createdAt).toLocaleString(),
        ]);
        csvContent = [
          headers.join(","),
          ...rows.map((row) => row.join(",")),
        ].join("\n");
      }

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export data", err);
    }
    setExportLoading(false);
  }, [filteredTransactions, userSalesData, adminBalanceData, activeTab]);

  useEffect(() => {
    if (isOpen) {
      fetchTransactions();
    }
  }, [isOpen, fetchTransactions]);

  const transactionTypes = [
    "TOPUP_APPROVED",
    "ORDER",
    "LOAN_DEDUCTION",
    "CART_ADD",
    "CART_REMOVE",
    "LOAN_STATUS",
    "TOPUP_REQUEST",
  ];

  return (
    <div className="">
      <li
        className="flex items-center space-x-3 p-2 rounded-md cursor-pointer bg-gray-700 hover:bg-gray-600"
        onClick={openModal}
      >
        <ArrowRightLeft className="w-5 h-5" />
        <div>Show Transactions</div>
      </li>

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
                <Dialog.Panel className="bg-white rounded-lg w-11/12 max-w-7xl h-[90vh] overflow-y-auto p-4 flex flex-col">
                  <Dialog.Title as="div" className="text-xl font-bold text-gray-900 mb-4 flex justify-between items-center sticky top-0 bg-white p-4 z-20 border-b">
                    <span>Transactional Overview</span>
                    <button
                      onClick={exportToCSV}
                      disabled={exportLoading}
                      className="text-sm px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {exportLoading ? "Exporting..." : `Export ${activeTab}`}
                    </button>
                  </Dialog.Title>

                  <div className="flex-grow overflow-y-auto px-4">
                    <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />

                    <div className="mt-6">
                      {activeTab === "transactions" && (
                        <>
                          {/* Filters and Actions */}
                          {/* <div className="flex flex-wrap items-center gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                            <input
                              type="date"
                              value={startDate}
                              onChange={(e) => setStartDate(e.target.value)}
                              className="form-input"
                            />
                            <input
                              type="date"
                              value={endDate}
                              onChange={(e) => setEndDate(e.target.value)}
                              className="form-input"
                            />
                            <select
                              value={typeFilter}
                              onChange={(e) => setTypeFilter(e.target.value)}
                              className="form-select"
                            >
                              <option value="">All Types</option>
                              {transactionTypes.map((type) => (
                                <option key={type} value={type}>
                                  {type}
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              placeholder="Search by user..."
                              value={search}
                              onChange={(e) => setSearch(e.target.value)}
                              className="form-input w-48"
                            />
                            <select
                              value={amountFilter}
                              onChange={(e) => setAmountFilter(e.target.value)}
                              className="form-select"
                            >
                              <option value="all">All Amounts</option>
                              <option value="positive">Credits Only</option>
                              <option value="negative">Debits Only</option>
                            </select>
                          </div> */}
                          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
                            <div className="flex flex-col lg:flex-row gap-4">
                              {/* Date Range Section */}
                              <div className="flex flex-col sm:flex-row gap-3 lg:border-r lg:border-gray-200 lg:pr-6">
                                <div className="flex flex-col">
                                  <label className="text-sm font-medium text-gray-700 mb-1">From</label>
                                  <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                  />
                                </div>
                                <div className="flex flex-col">
                                  <label className="text-sm font-medium text-gray-700 mb-1">To</label>
                                  <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                  />
                                </div>
                              </div>

                              {/* Filters Section */}
                              <div className="flex flex-col sm:flex-row gap-3 lg:border-r lg:border-gray-200 lg:pr-6">
                                <div className="flex flex-col">
                                  <label className="text-sm font-medium text-gray-700 mb-1">Type</label>
                                  <select
                                    value={typeFilter}
                                    onChange={(e) => setTypeFilter(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white"
                                  >
                                    <option value="">All Types</option>
                                    {transactionTypes.map((type) => (
                                      <option key={type} value={type}>
                                        {type}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="flex flex-col">
                                  <label className="text-sm font-medium text-gray-700 mb-1">Amount</label>
                                  <select
                                    value={amountFilter}
                                    onChange={(e) => setAmountFilter(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white"
                                  >
                                    <option value="all">All Amounts</option>
                                    <option value="positive">Credits Only</option>
                                    <option value="negative">Debits Only</option>
                                  </select>
                                </div>
                              </div>

                              {/* Search Section */}
                              <div className="flex flex-col flex-1">
                                <label className="text-sm font-medium text-gray-700 mb-1">Search</label>
                                <div className="relative">
                                  <input
                                    type="text"
                                    placeholder="Search by user..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                  />
                                  <svg
                                    className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Summary Cards */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                              <div className="text-sm text-blue-800">Total Transactions</div>
                              <div className="font-bold text-lg">{stats.totalTransactions}</div>
                            </div>
                            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                              <div className="text-sm text-green-800">Total Credits</div>
                              <div className="font-bold text-lg">
                                GH₵{" "}
                                {stats.totalCredits.toLocaleString("en-GH", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </div>
                            </div>
                            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                              <div className="text-sm text-red-800">Total Debits</div>
                              <div className="font-bold text-lg">
                                GH₵{" "}
                                {Math.abs(stats.totalDebits).toLocaleString("en-GH", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </div>
                            </div>
                            <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                              <div className="text-sm text-purple-800">Net Balance Change</div>
                              <div className="font-bold text-lg">
                                GH₵{" "}
                                {stats.netBalance.toLocaleString("en-GH", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </div>
                            </div>
                          </div>

                          {/* Virtualized Table Container */}
                          <div className="border rounded-lg overflow-hidden">
                            <div
                              className="overflow-auto"
                              style={{ height: "450px" }}
                              onScroll={onScroll}
                            >
                              <table className="min-w-full text-sm text-left">
                                <thead className="bg-gray-100 sticky top-0 z-10">
                                  <tr>
                                    <th className="px-4 py-2 border w-32">Type</th>
                                    <th className="px-4 py-2 border w-80">Description</th>
                                    <th className="px-4 py-2 border w-32">Amount</th>
                                    <th className="px-4 py-2 border w-32 whitespace-nowrap">Current Balance</th>
                                    <th className="px-4 py-2 border w-32 whitespace-nowrap">Previous Balance</th>
                                    <th className="px-4 py-2 border w-40">User</th>
                                    <th className="px-4 py-2 border w-48">Date & Time</th>
                                  </tr>
                                </thead>
                                <tbody style={{ position: "relative", height: `${totalHeight}px` }}>
                                  {loading ? (
                                    <tr>
                                      <td colSpan="7" className="text-center py-12 text-gray-500">
                                        Loading transactions...
                                      </td>
                                    </tr>
                                  ) : (
                                    <>
                                      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${offsetY}px)` }}>
                                        {visibleItems.map((tx, index) => (
                                          <TransactionRow
                                            key={tx.id}
                                            tx={tx}
                                            index={index + Math.floor(offsetY / 50)}
                                          />
                                        ))}
                                      </div>
                                      {!filteredTransactions.length && !loading && (
                                        <tr>
                                          <td colSpan="7" className="text-center py-8 text-gray-500">
                                            No transactions found.
                                          </td>
                                        </tr>
                                      )}
                                    </>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Pagination */}
                          {filteredTransactions.length > 0 && (
                            <div className="flex justify-between items-center mt-4">
                              <div className="text-sm text-gray-600">
                                Showing {Math.min(itemsPerPage, filteredTransactions.length)} of {stats.totalTransactions} transactions
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                  disabled={currentPage === 1}
                                  className="px-3 py-1 border rounded disabled:opacity-50"
                                >
                                  Previous
                                </button>
                                <span className="px-3 py-1">Page {currentPage}</span>
                                <button
                                  onClick={() => setCurrentPage((p) => p + 1)}
                                  disabled={filteredTransactions.length < itemsPerPage}
                                  className="px-3 py-1 border rounded disabled:opacity-50"
                                >
                                  Next
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {activeTab === "sales" && (
                        <UserSalesSummary userSales={userSalesData} />
                      )}

                      {activeTab === "balance" && (
                        <AdminBalanceSheet balanceData={adminBalanceData} />
                      )}
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t sticky bottom-0 bg-white p-4 z-20">
                    <button
                      onClick={closeModal}
                      className="px-5 py-2 bg-red-600 text-white rounded hover:bg-red-700 w-full"
                    >
                      Close
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default TransactionalAdminModal;
