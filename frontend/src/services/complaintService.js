import authService from "./authService";
const apiClient = authService.apiClient;

const BASE_URL = "/complaints/";

const getComplaints = async (municipalityId = null) => {
  let url = BASE_URL;

  if (municipalityId) {
    url = `/municipalities/${municipalityId}/complaints/`;
  }

  const response = await apiClient.get(url);
  return response.data;
};
const getComplaintById = async (id) => {
  if (!id || id === 'undefined') {
    console.warn("getComplaintById called with invalid ID:", id);
    return null;
  }
  const response = await apiClient.get(`${BASE_URL}${id}/`);
  return response.data;
};

const createComplaint = async (complaintData) => {
  const formData = new FormData();
  for (const key in complaintData) {
    if (complaintData[key] !== null && complaintData[key] !== undefined) {
      formData.append(key, complaintData[key]);
    }
  }

  const response = await apiClient.post(BASE_URL, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

const addComment = async (complaintId, content) => {
  const response = await apiClient.post(`${BASE_URL}${complaintId}/add_comment/`, {
    content,
  });
  return response.data;
};


const toggleUpvote = async (complaintId) => {
  const response = await apiClient.post(`${BASE_URL}${complaintId}/upvote/`);
  return response.data;
};

const updateStatus = async (complaintId, newStatus) => {
  const response = await apiClient.patch(`${BASE_URL}${complaintId}/`, {
    status: newStatus,
  });
  return response.data;
};

const getRankedComplaints = async (page = 1, municipalityId = null) => {
  const params = { page };
  if (municipalityId) {
    params.municipality_id = municipalityId;
  }
  const response = await apiClient.get(`${BASE_URL}ranked/`, {
    params,
  });
  return response.data;
};

const checkSimilar = async (data) => {
  const response = await apiClient.post(`${BASE_URL}check_similar/`, data);
  return response.data;
};


const complaintService = {
  getComplaints,
  getComplaintById,
  createComplaint,
  addComment,
  toggleUpvote,
  updateStatus,
  getRankedComplaints,
  checkSimilar,
};

export default complaintService;
