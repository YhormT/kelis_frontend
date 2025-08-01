// Sidebar.js
import React from "react";
import {
  Home,
  LogOut,
  History,
} from "lucide-react";
import TransactionsModal from "./TransactionsModal";
import UploadExcel from "./UploadExcel";
import PasteOrders from "./PasteOrders";
import Logo from "../assets/logo-icon.png";
import bgImage from "../assets/sidefloor.jpg";
import { Dialog } from "@headlessui/react";
import AuditLog from "./AuditLog";

const Sidebar = ({
  isOpen,
  setIsOpen,
  selectedCategory,
  handleCategorySelect,
  logoutUser,
  setDailySalesOpen,
  onUploadSuccess
}) => {
  const [showAuditLog, setShowAuditLog] = React.useState(false);
  return (
    <aside
      className={`bg-white w-64 p-5 fixed h-full transition-transform transform ${
        isOpen ? "translate-x-0" : "-translate-x-64"
      } md:translate-x-0 shadow-lg flex flex-col justify-between`}
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "contain",
        backgroundPosition: "bottom",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div>
        <div className="flex items-center justify-between mb-5">
          <img src={Logo} height={150} width={150} alt="Logo" />
          <button className="md:hidden" onClick={() => setIsOpen(false)}>
            X
          </button>
        </div>

        <hr />

        <nav>
          <ul className="space-y-4">
            
            {/* Home */}
            <li
              className={`flex items-center space-x-3 p-2 rounded-md cursor-pointer ${
                window.location.pathname === "/dashboard/home"
                  ? "bg-blue-500 text-white"
                  : "hover:bg-gray-200"
              }`}
              onClick={() => {
                handleCategorySelect(null);
                setIsOpen(false);
              }}
            >
              <Home className="w-5 h-5" />
              <span>Home</span>
            </li>

            {/* MTN */}
            <li
              className={`flex items-center space-x-3 p-2 rounded-md cursor-pointer ${
                selectedCategory === "MTN"
                  ? "bg-blue-500 text-white"
                  : "hover:bg-gray-200"
              }`}
              onClick={() => {
                handleCategorySelect("MTN");
                setIsOpen(false);
              }}
            >
              <img
                src="https://images.seeklogo.com/logo-png/9/1/mtn-logo-png_seeklogo-95716.png"
                className="w-5 h-5"
                alt="MTN"
              />
              <span>MTN</span>
            </li>

            {/* TELECEL */}
            <li
              className={`flex items-center space-x-3 p-2 rounded-md cursor-pointer ${
                selectedCategory === "TELECEL"
                  ? "bg-blue-500 text-white"
                  : "hover:bg-gray-200"
              }`}
              onClick={() => {
                handleCategorySelect("TELECEL");
                setIsOpen(false);
              }}
            >
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTl4R7lA1tlSlrBzf9OrDXIswYytfI7TfvC0w&s"
                className="w-5 h-5"
                alt="TELECEL"
              />
              <span>TELECEL</span>
            </li>

            {/* AIRTEL TIGO */}
            <li
              className={`flex items-center space-x-3 p-2 rounded-md cursor-pointer ${
                selectedCategory === "AIRTEL TIGO"
                  ? "bg-blue-500 text-white"
                  : "hover:bg-gray-200"
              }`}
              onClick={() => {
                handleCategorySelect("AIRTEL TIGO");
                setIsOpen(false);
              }}
            >
              <img
                src="https://play-lh.googleusercontent.com/yZFOhTvnlb2Ply82l8bXusA3OAhYopla9750NcqsjqcUNAd4acuohCTAlqHR9_bKrqE"
                className="w-5 h-5"
                alt="AIRTEL TIGO"
              />
              <span>AIRTEL TIGO</span>
            </li>

            <hr className="my-10" />
            <TransactionsModal />
            {/* Audit Log Button - always visible for admin */}
            {/* <li
              className={`flex items-center space-x-3 p-2 rounded-md cursor-pointer ${
                showAuditLog ? "bg-blue-500 text-white" : "hover:bg-gray-200 text-gray-700"
              }`}
              onClick={() => setShowAuditLog(true)}
            >
              <History className="w-5 h-5" />
              <span>Audit Log</span>
            </li> */}
            <hr className="my-10" />
            <div onClick={() => setIsOpen(false)}>
              <UploadExcel onUploadSuccess={onUploadSuccess} />
            </div>

            <hr className="my-5" />

            <div onClick={() => setIsOpen(false)}>
              <PasteOrders onUploadSuccess={onUploadSuccess} />
            </div>

            {/* Daily Sales */}
            {/* <li
              className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-200 cursor-pointer text-green-600"
              onClick={() => {
                setDailySalesOpen(true);
                setIsOpen(false);
              }}
            >
              <History className="w-5 h-5" />
              <span>Daily Sales</span>
            </li> */}

            {/* Logout */}
            <li
              className="flex items-center space-x-3 p-2 rounded-md hover:bg-red-700 cursor-pointer text-black-500"
              onClick={logoutUser}
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </li>
          </ul>
        </nav>
      </div>

      {/* Audit Log Modal */}
      {/* <Dialog open={showAuditLog} onClose={() => setShowAuditLog(false)} className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black bg-opacity-40" aria-hidden="true" />
        <div className="relative bg-white rounded-lg shadow-lg w-[95vw] md:w-[70vw] max-h-[90vh] overflow-y-auto p-4">
          <Dialog.Title className="text-xl font-bold mb-2">Audit Log</Dialog.Title>
          <button onClick={() => setShowAuditLog(false)} className="absolute top-2 right-4 text-gray-500 hover:text-red-500 text-lg">&times;</button>
          <AuditLog />
        </div>
      </Dialog> */}

      {/* <div className="mb-[100px] p-3 bg-gray-100 rounded-lg text-center">
        <p className="text-xs text-gray-500">Sponsored Ad</p>
        <video
          className="mt-2 rounded-lg w-full hover:opacity-80 transition-opacity duration-300"
          controls
          autoPlay
          loop
          muted
        >
          <source
            src="https://www.w3schools.com/html/mov_bbb.mp4"
            type="video/mp4"
          />
          Your browser does not support the video tag.
        </video>
      </div> */}
    </aside>
  );
};

export default Sidebar;


