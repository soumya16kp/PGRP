import axios from 'axios';


const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  const authFreeEndpoints = [
    '/login/',
    '/signup/',
    '/municipality/send-otp/',
    '/municipality/verify-otp/',
  ];

  const isAuthFree = authFreeEndpoints.some((url) =>
    config.url.includes(url)
  );

  if (token && !isAuthFree) {
    config.headers.Authorization = `Token ${token}`;
  }

  return config;
});




const login = async (username, password) => {
  const response = await apiClient.post('/login/', { username, password });
  
  if (response.data.token) {
    const token = response.data.token;
    localStorage.setItem("token", token);  
    apiClient.defaults.headers.common['Authorization'] = `Token ${token}`;
    const userResponse = await getCurrentUser();
    return { token: token, user: userResponse };
  }
  return response.data;
};

const signup = async (username, email, password) => {
  const response = await apiClient.post('/signup/', {
    username,
    email,
    password,
  });
  if (response.data.token) {
    const token = response.data.token;
    localStorage.setItem("token", token);
    apiClient.defaults.headers.common['Authorization'] = `Token ${token}`;
  }
  return response.data;
};

const logout = async () => {
  try {
    await apiClient.post('/logout/');
  } catch (e) {
    console.error("Logout error", e);
  }
  localStorage.removeItem("token");
  delete apiClient.defaults.headers.common['Authorization'];
};

const getCurrentUser = async () => {
  try {
    const response = await apiClient.get('/protected/');
    return response.data.user_details; 
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return null;
  }
};


const sendMunicipalityOtp = async (email, phone, password) => {
    const response = await apiClient.post('/municipality/send-otp/', {
        email,
        phone,
        password
    });
    return response.data;
};

// Step 2: Verify OTP and Login
const verifyMunicipalityOtp = async (phone, otp) => {
  const response = await apiClient.post('/municipality/verify-otp/', {
    phone,
    otp,
  });

  if (response.data.token) {
    const token = response.data.token;
    localStorage.setItem("token", token);
    apiClient.defaults.headers.common["Authorization"] = `Token ${token}`;


    return { token: token, user: response.data.official }; 
  }

  return response.data;
};

const authService = {
  apiClient,
  login,
  signup,
  logout,
  getCurrentUser,
  sendMunicipalityOtp,
  verifyMunicipalityOtp,
};

export default authService;