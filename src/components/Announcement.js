import React, { useState, useCallback } from "react";
import axios from "axios";
import BASE_URL from "../endpoints/endpoints";
import { Dialog, Transition } from "@headlessui/react";
import { toast } from "react-toastify";
import { Megaphone, X, Send, Loader2 } from "lucide-react";

const Announcement = ({ onAnnouncementSaved }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = useCallback(() => {
    if (!loading) {
      setIsOpen(false);
      // Reset form when closing
      setTimeout(() => {
        setTitle("");
        setMessage("");
      }, 200);
    }
  }, [loading]);

  const handleSave = useCallback(async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Title and message are required.");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${BASE_URL}/api/announcement/`,
        { title, message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      window.alert("Announcement saved successfully!");
      setTitle("");
      setMessage("");
      closeModal();
      if (onAnnouncementSaved) onAnnouncementSaved();
    } catch (err) {
      window.alert(err.response?.data?.message || "Failed to save announcement.");
    } finally {
      setLoading(false);
    }
  }, [title, message, closeModal, onAnnouncementSaved]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Escape" && !loading) {
      closeModal();
    }
    if (e.key === "Enter" && e.ctrlKey && !loading) {
      handleSave();
    }
  }, [loading, closeModal, handleSave]);

  // Add keyboard event listener
  React.useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (isOpen) {
        handleKeyDown(e);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleGlobalKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  return (
    <div>
      {/* Trigger Button */}
      <li 
        className="flex items-center space-x-3 p-2 rounded-md cursor-pointer bg-gray-700 hover:bg-gray-600"
        onClick={openModal}
      >
          <Megaphone className="w-5 h-5" />
        <div className="font-medium">Announcement</div>
      </li>

      {/* Enhanced Modal */}
      <Transition appear show={isOpen} as={React.Fragment}>
        <Dialog 
          as="div" 
          className="relative z-50" 
          onClose={closeModal}
        >
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={React.Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl 
                                        bg-white p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Megaphone className="w-6 h-6 text-blue-600" />
                    </div>
                    <Dialog.Title className="text-xl font-bold text-gray-900">
                      New Announcement
                    </Dialog.Title>
                  </div>
                  <button
                    onClick={closeModal}
                    disabled={loading}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 
                               rounded-lg transition-colors duration-200 disabled:opacity-50"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form */}
                <div className="space-y-4">
                  {/* Title Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg 
                                 focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                 transition-all duration-200 disabled:bg-gray-50 disabled:opacity-50
                                 placeholder-gray-400"
                      placeholder="Enter announcement title..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      disabled={loading}
                      maxLength={200}
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Make it clear and engaging</span>
                      <span>{title.length}/200</span>
                    </div>
                  </div>

                  {/* Message Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message
                    </label>
                    <textarea
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg resize-none
                                 focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                 transition-all duration-200 disabled:bg-gray-50 disabled:opacity-50
                                 placeholder-gray-400"
                      placeholder="Write your announcement message here..."
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      disabled={loading}
                      maxLength={1000}
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Provide clear details about your announcement</span>
                      <span>{message.length}/1000</span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-8 pt-4 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    Press Ctrl+Enter to save quickly
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 
                                 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 
                                 focus:ring-offset-2 transition-colors duration-200 
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={closeModal}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center px-4 py-2 text-sm font-medium 
                                 text-white bg-blue-600 rounded-lg hover:bg-blue-700 
                                 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
                                 transition-colors duration-200 disabled:opacity-50 
                                 disabled:cursor-not-allowed min-w-[80px] justify-center"
                      onClick={handleSave}
                      disabled={loading || !title.trim() || !message.trim()}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Publish
                        </>
                      )}
                    </button>
                  </div>
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

export default Announcement;