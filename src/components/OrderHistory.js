import { useState } from "react";
import { Dialog } from "@headlessui/react";

const OrderHistory = ({ isHistoryOpen, setIsHistoryOpen, orderHistory }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [itemIdFilter, setItemIdFilter] = useState(""); // ✅ New state

  const filteredOrders = orderHistory
    .map((order) => {
      const filteredItems = order.items.filter(
        (item) =>
          (!searchTerm || item.mobileNumber.includes(searchTerm)) &&
          (!statusFilter || item.status === statusFilter) &&
          (!itemIdFilter || String(item.id).includes(itemIdFilter))
      );

      return filteredItems.length > 0
        ? { ...order, items: filteredItems }
        : null;
    })
    .filter(Boolean);

  return (
    <Dialog
      open={isHistoryOpen}
      onClose={() => setIsHistoryOpen(false)}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center px-4 sm:px-6 md:px-8">
        <Dialog.Panel className="bg-white p-4 sm:p-6 rounded-md shadow-lg w-full max-w-[32rem] sm:max-w-lg md:max-w-xl lg:max-w-2xl relative">
          <Dialog.Title className="text-lg font-semibold">
            Order History
          </Dialog.Title>

          <button
            className="absolute top-2 right-2 text-gray-500"
            onClick={() => setIsHistoryOpen(false)}
          >
            ✖
          </button>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 mt-4">
            {/* Search by Phone Number */}
            <input
              type="text"
              placeholder="Search by Phone Number"
              className="border p-2 rounded w-full sm:flex-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {/* Filter by Item ID */}
            <input
              type="text"
              placeholder="Filter by Item ID"
              className="border p-2 rounded w-full sm:flex-1"
              value={itemIdFilter}
              onChange={(e) => setItemIdFilter(e.target.value)}
            />

            {/* Filter by Status */}
            <select
              className="border p-2 rounded w-full sm:w-auto"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Order List */}
          {filteredOrders.length > 0 ? (
            <ul className="space-y-2 mt-4 h-80 overflow-y-auto border p-2 rounded-md">
              {filteredOrders.flatMap((order) =>
                order.items.map((item) => (
                  <li
                    key={item.id}
                    className="border p-3 rounded-md shadow-sm bg-white"
                  >
                    <div className="flex items-center space-x-2">
                                          <strong>Order ID:</strong>
                    <p className="text-gray-600">{order.id || "N/A"}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <strong>Item ID:</strong>
                      <p className="text-gray-600">{item.id || "N/A"}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <strong>Phone:</strong>
                      <p className="text-gray-600">
                        {item.mobileNumber || "N/A"}
                      </p>
                    </div>
                    <p>
                      <strong>Date:</strong>{" "}
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                    <p>
                      <strong>Time:</strong>{" "}
                      {new Date(order.createdAt).toLocaleTimeString()}
                    </p>
                    <p>
                      <strong>Item:</strong> {item.product?.name || "Unknown"}
                    </p>
                    <p>
                      <strong>Bundle amount:</strong>{" "}
                      {item.product?.description || "Unknown"}
                    </p>
                    <div className="flex items-center space-x-2">
                      <strong>Status:</strong>
                      <span
                        className={`px-2 py-1 rounded text-white text-sm ${
                          item.status === "Pending"
                            ? "bg-yellow-500"
                            : item.status === "Processing"
                            ? "bg-blue-500"
                            : item.status === "Completed"
                            ? "bg-green-500"
                            : "bg-gray-500"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </li>
                ))
              )}
            </ul>
          ) : (
            <p className="text-gray-500 mt-4">No orders found.</p>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default OrderHistory;
