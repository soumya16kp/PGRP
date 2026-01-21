import React, { useState } from "react";
import { useUser } from "../context/UserContext";
import userService from "../services/userService";
import { User, Phone, Briefcase, Camera, Save, Loader2 } from "lucide-react";
import "./AccountForm.css";

const AccountForm = ({ onClose }) => {
  const { user, setUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(user?.profile_image || null);

  const [formData, setFormData] = useState({
    bio: user?.bio || "",
    phone: user?.phone || "",
    designation: user?.designation || "",
    profile_image: null,
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, profile_image: file });
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updated = await userService.updateProfile(formData);
      setUser(updated);
      setTimeout(() => {
        onClose?.();
      }, 500);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="account-form-modern" onSubmit={handleSubmit}>

      {/* Profile Image Upload */}
      <div className="form-group image-upload-group">
        <div className="image-preview-wrapper">
          <img
            src={preview || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=face"}
            alt="Profile Preview"
            className="image-preview"
          />
          <label className="image-upload-btn">
            <Camera size={16} />
            <input type="file" name="profile_image" onChange={handleFileChange} accept="image/*" hidden />
          </label>
        </div>
        <p className="upload-hint">Click camera icon to change photo</p>
      </div>

      <div className="form-grid">
        {/* Designation */}
        <div className="form-group">
          <label>
            <Briefcase size={14} /> Designation
          </label>
          <input
            type="text"
            name="designation"
            value={formData.designation}
            onChange={handleChange}
            placeholder="e.g. Citizen, Social Worker"
            className="form-input"
          />
        </div>

        {/* Phone */}
        <div className="form-group">
          <label>
            <Phone size={14} /> Phone
          </label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+91 98765 43210"
            className="form-input"
          />
        </div>
      </div>

      {/* Bio */}
      <div className="form-group full-width">
        <label>
          <User size={14} /> Bio
        </label>
        <textarea
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          placeholder="Tell us a bit about yourself..."
          className="form-textarea"
        />
      </div>

      <button type="submit" className="save-btn-modern" disabled={loading}>
        {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
        {loading ? "Saving Changes..." : "Save Profile"}
      </button>

    </form>
  );
};

export default AccountForm;
