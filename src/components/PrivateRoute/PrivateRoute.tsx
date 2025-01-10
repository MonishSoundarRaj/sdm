import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

export function PrivateRoute({ element }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Call a protected API route to check if the user is authenticated
    fetch('http://ec2-3-230-142-41.compute-1.amazonaws.com:5000/api/protected', {
      method: 'GET',
      credentials: 'include', // Ensure cookies are sent with the request
    })
    .then(response => {
      if (response.ok) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    })
    .catch(() => {
      setIsAuthenticated(false);
    })
    .finally(() => {
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading...</div>;

  return isAuthenticated ? element : <Navigate to="/authentication" />;
}
