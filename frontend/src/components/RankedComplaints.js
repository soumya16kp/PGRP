import React, { useEffect, useState } from "react";
import complaintService from "../services/complaintService";

const RankedComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const data = await complaintService.getRankedComplaints(page);

      if (data.results.length === 0) {
        setHasMore(false);
      } else {
        setComplaints((prev) => [...prev, ...data.results]);
      }
    } catch (err) {
      console.error("Error fetching ranked complaints:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [page]);

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">🏆 Top Ranked Complaints</h2>

      {complaints.map((c) => (
        <div
          key={c.id}
          className="border rounded-lg p-3 mb-3 shadow-sm hover:shadow-md transition"
        >
          <div className="flex justify-between">
            <h3 className="font-semibold">{c.topic}</h3>
            <span className="text-sm text-gray-600">🔥 Score: {c.score}</span>
          </div>
          <p className="text-gray-700 text-sm mt-1">{c.description}</p>
          <div className="flex justify-between text-sm text-gray-500 mt-2">
            <span>📍 {c.location}</span>
            <span>⬆️ {c.total_upvotes}</span>
          </div>
        </div>
      ))}

      {loading && <p className="text-center mt-3">Loading...</p>}

      {hasMore && !loading && (
        <div className="text-center mt-4">
          <button
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
};

export default RankedComplaints;
