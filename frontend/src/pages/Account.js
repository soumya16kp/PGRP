import { useUser } from "../context/UserContext";
import AccountForm from "../forms/AccountForm";
import authService from "../services/authService";
import userService from "../services/userService";
import { useDispatch } from "react-redux";
import { logout } from "../store/AuthSlice";
import { useState } from "react";
import "./Account.css"; 

const AccountPage = () => {
  const { user, loading } = useUser();
  const dispatch = useDispatch();

  const [photosize, setphotosize] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editUser, setEditUser] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");

  const togglephotosize = () => setphotosize(!photosize);
  const editingToggle = () => setEditing(!editing);
  const editUserToggle = () => {
    setEditUser(!editUser);
    setEditing(false);
  };

  if (loading) return <p className="loading">Loading...</p>;
  if (!user) return <p className="no-user">No user data available.</p>;

  const handleLogout = async () => {
    try {
      await authService.logout();
      dispatch(logout());
    } catch (error) {
      console.error(error);
    }
  };

  const handleSetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        try {
          const updatedProfile = await userService.updateProfile({
            latitude,
            longitude,
          });
          setLocationMessage(
            updatedProfile.municipality_name
              ? `Location set! Assigned municipality: ${updatedProfile.municipality_name}`
              : "Location updated, but municipality not assigned."
          );
        } catch (err) {
          console.error(err);
          setLocationMessage("Failed to update location.");
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        console.error(error);
        setLocationMessage("Unable to fetch your location.");
        setLocationLoading(false);
      }
    );
  };

  return (
    <>
      {editUser && (
        <div className="account-form-popup">
          <div className="account-form">
            <h3 className="edit-title">Edit Profile</h3>
            <span className="close-btn" onClick={editUserToggle}>
              &times;
            </span>
            <AccountForm user={user} onClose={editUserToggle} />
          </div>
        </div>
      )}
      <div className="account-container">
        <h2 className="account-title">Account</h2>
        <div className="edit-btn">
          <i className="fa-solid fa-ellipsis-vertical" onClick={editingToggle}></i>
          {editing && (
            <div className="edit-options">
              <button onClick={editUserToggle}>Edit Profile</button>
              <button onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>
        {user.profile_image && (
          <img
            src={`${user.profile_image}`}
            alt="Profile"
            className="profile-img"
            onClick={togglephotosize}
          />
        )}
        {photosize && (
          <div className="logo-big">
            <i className="fa-solid fa-xmark" onClick={togglephotosize}></i>
            <img
              src={`${user.profile_image}`}
              alt="Profile"
              className="profile-img"
              onClick={togglephotosize}
            />
          </div>
        )}
        <div className="account-info">
          <p>
            <strong>Username:</strong> {user.user.username}
          </p>
          <p>
            <strong>Email:</strong> {user.user.email}
          </p>
          <p>
            <strong>Bio:</strong> {user.bio || "Not provided"}
          </p>
          <p>
            <strong>Phone:</strong> {user.phone || "Not provided"}
          </p>
          <p>
            <strong>Designation:</strong> {user.designation || "Not provided"}
          </p>
          <p>
            <strong>Municipality:</strong>{" "}
            {user.municipality_name || "Not assigned"}
          </p>
        </div>

        <button
          className="set-location-btn"
          onClick={handleSetLocation}
          disabled={locationLoading}
        >
          {locationLoading ? "Setting Location..." : "Set My Location"}
        </button>
        {locationMessage && <p className="location-message">{locationMessage}</p>}

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </>
  );
};

export default AccountPage;
