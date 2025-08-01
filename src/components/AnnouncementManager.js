import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

const AnnouncementManager = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    isActive: true,
    priority: 1,
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      setTimeout(() => {
        setAnnouncements([
          {
            id: "1",
            title: "System Maintenance",
            message: "PLEASE REMEMBER TO LOGOUT BEFORE CLOSING YOUR TAB!!!",
            isActive: true,
            priority: 3,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "2",
            title: "Premium Features",
            message: "✨ New premium dashboard features are now available",
            isActive: true,
            priority: 2,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "3",
            title: "Security Update",
            message: "🚀 Enhanced security measures have been implemented",
            isActive: false,
            priority: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Failed to fetch announcements:", error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      alert("Title and message are required");
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        setAnnouncements((prev) =>
          prev.map((item) =>
            item.id === editingId
              ? { ...item, ...formData, updatedAt: new Date().toISOString() }
              : item
          )
        );
        alert("Announcement updated successfully!");
      } else {
        const newAnnouncement = {
          id: Date.now().toString(),
          ...formData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setAnnouncements((prev) => [newAnnouncement, ...prev]);
        alert("Announcement created successfully!");
      }

      resetForm();
      setLoading(false);
    } catch (error) {
      console.error("Failed to save announcement:", error);
      alert("Failed to save announcement");
      setLoading(false);
    }
  };

  const handleEdit = (announcement) => {
    setFormData({
      title: announcement.title,
      message: announcement.message,
      isActive: announcement.isActive,
      priority: announcement.priority,
    });
    setEditingId(announcement.id);
    setShowCreateForm(true);
  };

  const handleDelete = async (id) => {
    // if (!confirm("Are you sure you want to delete this announcement?")) return;

    setLoading(true);
    try {
      setAnnouncements((prev) => prev.filter((item) => item.id !== id));
      alert("Announcement deleted successfully!");
      setLoading(false);
    } catch (error) {
      console.error("Failed to delete announcement:", error);
      alert("Failed to delete announcement");
      setLoading(false);
    }
  };

  const toggleStatus = async (id) => {
    setLoading(true);
    try {
      setAnnouncements((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                isActive: !item.isActive,
                updatedAt: new Date().toISOString(),
              }
            : item
        )
      );
      setLoading(false);
    } catch (error) {
      console.error("Failed to toggle announcement status:", error);
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      message: "",
      isActive: true,
      priority: 1,
    });
    setEditingId(null);
    setShowCreateForm(false);
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleString();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Announcement Management
            </h1>
            <p className="text-gray-300">
              Manage system-wide announcements displayed on the login page
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 px-6 py-3 rounded-xl text-white font-semibold transition-all duration-300 transform hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            <span>New Announcement</span>
          </button>
        </div>

        {/* Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <form
              onSubmit={handleSubmit}
              className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 w-full max-w-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {editingId ? "Edit Announcement" : "Create New Announcement"}
                </h2>
                <button
                  onClick={resetForm}
                  type="button"
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white"
                    placeholder="Enter title"
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Message *
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        message: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white h-24 resize-none"
                    placeholder="Enter message"
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {formData.message.length}/500 characters
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          priority: parseInt(e.target.value),
                        }))
                      }
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white"
                    >
                      {[1, 2, 3, 4, 5].map((p) => (
                        <option key={p} value={p} className="bg-gray-800">
                          {
                            ["Low", "Medium", "High", "Critical", "Emergency"][
                              p - 1
                            ]
                          }{" "}
                          ({p})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Status
                    </label>
                    <div className="flex space-x-4 pt-3">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="isActive"
                          checked={formData.isActive}
                          onChange={() =>
                            setFormData((prev) => ({ ...prev, isActive: true }))
                          }
                        />
                        <span className="text-green-400">Active</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="isActive"
                          checked={!formData.isActive}
                          onChange={() =>
                            setFormData((prev) => ({
                              ...prev,
                              isActive: false,
                            }))
                          }
                        />
                        <span className="text-red-400">Inactive</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-cyan-600 hover:bg-cyan-700 px-6 py-3 rounded-xl text-white font-semibold flex items-center space-x-2"
                  >
                    <Save className="w-5 h-5" />
                    <span>{editingId ? "Update" : "Save"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Announcements List */}
        <div className="space-y-4">
          {loading ? (
            <p className="text-white text-center">Loading...</p>
          ) : announcements.length === 0 ? (
            <p className="text-gray-300 text-center">No announcements found.</p>
          ) : (
            announcements.map((item) => (
              <div
                key={item.id}
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4 flex justify-between items-start text-white"
              >
                <div>
                  <h3 className="text-xl font-bold">{item.title}</h3>
                  <p className="text-gray-300">{item.message}</p>
                  <div className="text-xs mt-2 text-gray-400">
                    <span>Priority: {item.priority} • </span>
                    <span>
                      Status: {item.isActive ? "Active" : "Inactive"} •{" "}
                    </span>
                    <span>Updated: {formatDate(item.updatedAt)}</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => handleEdit(item)} title="Edit">
                    <Edit className="w-5 h-5 text-yellow-400 hover:text-yellow-300" />
                  </button>
                  <button onClick={() => handleDelete(item.id)} title="Delete">
                    <Trash2 className="w-5 h-5 text-red-400 hover:text-red-300" />
                  </button>
                  <button
                    onClick={() => toggleStatus(item.id)}
                    title="Toggle Status"
                  >
                    {item.isActive ? (
                      <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-200" />
                    ) : (
                      <Eye className="w-5 h-5 text-green-400 hover:text-green-300" />
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementManager;
