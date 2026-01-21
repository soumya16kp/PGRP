import authService from "./authService";

const api = authService.apiClient;

const reviewService = {
  createReview: (data) => api.post("/reviews/create/", data),
  getMyReviews: () => api.get("/reviews/my-complaints/")
};

export default reviewService;
