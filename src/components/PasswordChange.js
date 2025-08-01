import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { Dialog } from "@headlessui/react";
import { Meh, Settings } from "lucide-react";
import BASE_URL from "../endpoints/endpoints";

const PasswordChange = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // const handlePasswordChange = async () => {
  //   if (newPassword !== confirmPassword) {
  //     setError("Passwords do not match!");
  //     return;
  //   }

  //   const userId = localStorage.getItem("userId"); // Retrieve userId from localStorage

  //   if (!userId) {
  //     setError("User ID not found. Please log in again.");
  //     return;
  //   }

  //   try {
  //     const response = await axios.put(
  //       `http://localhost:5000/api/users/${userId}/updatePassword`,
  //       { newPassword },
  //       { headers: { "Content-Type": "application/json" } }
  //     );

  //     if (response.status === 200) {
  //       setSuccessMessage("Password changed successfully!");
  //       setError("");

  //       setTimeout(() => {
  //         setIsOpen(false);
  //         setSuccessMessage("");
  //       }, 2000);
  //     }
  //   } catch (err) {
  //     setError(err.response?.data?.message || "Server error. Try again later.");
  //   }
  // };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Passwords do not match!",
      });
      return;
    }

    const userId = localStorage.getItem("userId");

    if (!userId) {
      Swal.fire({
        icon: "warning",
        title: "User ID Not Found",
        text: "Please log in again.",
      });
      return;
    }

    try {
      const response = await axios.put(
        `${BASE_URL}/api/users/${userId}/updatePassword`,
        { newPassword },
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.status === 200) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Password changed successfully!",
          timer: 2000,
          showConfirmButton: false,
        });

        setTimeout(() => {
          setIsOpen(false);
          setNewPassword("");
          setConfirmPassword("");
        }, 2000);
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.response?.data?.message || "Server error. Try again later.",
      });
    }
  };

  return (
    <div>
      {/* Button to open modal */}
      <div className="cursor-pointer" onClick={() => setIsOpen(true)}>
        <Settings />
        {/* Profile */}
      </div>

      {/* Password Change Modal */}
      <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="relative z-50">
        {/* Overlay */}
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        {/* Modal Content */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md bg-white p-6 rounded-lg shadow-lg">
            <Dialog.Title className="text-lg font-semibold">Change Password</Dialog.Title>

            {/* Password Fields */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">New Password</label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {/* Error & Success Messages */}
            {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}
            {successMessage && <p className="mt-2 text-green-500 text-sm">{successMessage}</p>}

            {/* Buttons */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordChange}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Update Password
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};

export default PasswordChange;
