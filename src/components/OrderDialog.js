import { useState } from "react";
import { Dialog } from "@headlessui/react";
import { FileText } from "lucide-react";

const OrderDialog = ({ filteredOrders = [] }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Grouping orders
  const groupedOrders = {
    "MTN": [],
    "TELECEL": [],
    "AIRTEL TIGO": [],
    "MTN - PREMIUM": [],
    "TELECEL - PREMIUM": [],
    "AIRTEL TIGO - PREMIUM": []
  };
  
  (filteredOrders ?? []).forEach(order => {
    const productName = order.product?.name?.toUpperCase(); // Ensure case consistency
    if (productName) {
      if (groupedOrders[productName]) {
        groupedOrders[productName].push(order);
      } else if (productName.includes("PREMIUM")) {
        // Assign to premium category if "PREMIUM" is in the name
        const baseName = productName.replace(" - PREMIUM", "").trim();
        if (groupedOrders[`${baseName} - PREMIUM`]) {
          groupedOrders[`${baseName} - PREMIUM`].push(order);
        }
      }
    }
  });
  

  return (
    <>
      <div
        className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4 w-full md:w-auto flex-1 cursor-pointer hover:shadow-lg transform hover:-translate-y-1 transition duration-300"
        onClick={() => setIsOpen(true)}
      >
        <FileText className="w-12 h-12 text-purple-500" />
        <div>
          <h3 className="text-xl font-semibold">Total Requests</h3>
          <p className="text-lg font-bold">{filteredOrders?.length || 0}</p>
        </div>
      </div>

      <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="fixed inset-0 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <Dialog.Panel className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
          <Dialog.Title className="text-lg font-semibold mb-4">Download Orders</Dialog.Title>
          <ul className="space-y-3">
            {Object.keys(groupedOrders).map((key) => (
              <li key={key} className="cursor-pointer text-blue-600 hover:underline" onClick={() => console.log(`Downloading ${key}`)}>
                Download {key} ({groupedOrders[key].length})
              </li>
            ))}
          </ul>
          <button className="mt-4 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400" onClick={() => setIsOpen(false)}>Close</button>
        </Dialog.Panel>
      </Dialog>
    </>
  );
};

export default OrderDialog;
