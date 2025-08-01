// DailySalesCard.js
import React from "react";
import { FileStack, ArrowRight } from "lucide-react";

const DailySalesCard = ({ amount, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between border border-gray-100 cursor-pointer hover:shadow-lg transform hover:-translate-y-1 transition duration-300"
    >
      <div className="flex items-center space-x-4">
        <div className="bg-indigo-100 p-3 rounded-full">
          <FileStack className="w-8 h-8 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-gray-500 text-sm font-medium">Today's Sales</h3>
          <p className="text-2xl font-bold text-green-500">
            {/* GH₵ {amount.toLocaleString("en-GH", { minimumFractionDigits: 2 })} */}
            GH₵ {Math.abs(amount).toLocaleString("en-GH", { minimumFractionDigits: 2 })}

          </p>
          {/* <p className="text-xs text-gray-400">Click to view transactions</p> */}
        </div>
      </div>
      <ArrowRight className="w-5 h-5 text-gray-400" />
    </div>
  );
};

export default DailySalesCard;
