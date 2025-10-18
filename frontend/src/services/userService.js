import authService from "./authService"; 

// Get current user profile
const getProfile = async () => {
  const response = await authService.apiClient.get("/profile/");
  return response.data;
};

const updateProfile = async (data) => {
  const formData = new FormData();

  // Existing fields
  if (data.bio !== undefined) formData.append("bio", data.bio);
  if (data.phone !== undefined) formData.append("phone", data.phone);
  if (data.designation !== undefined) formData.append("designation", data.designation);
  if (data.profile_image instanceof File) {
    formData.append("profile_image", data.profile_image);
  }

  // ✅ New fields for location
  if (data.latitude !== undefined) formData.append("latitude", data.latitude.toFixed(10));
  if (data.longitude !== undefined) formData.append("longitude", data.longitude.toFixed(10));

  const response = await authService.apiClient.put("/profile/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  console.log(data);
  return response.data;
};

const userService = {
  getProfile,
  updateProfile,
};

export default userService;
