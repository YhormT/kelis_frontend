import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageCircleWarning } from "lucide-react";
import Swal from "sweetalert2";

const OtherProducts = ({ 
  products, 
  setFilteredProducts1, 
  loanBalance,
  mobileNumbers,
  setMobileNumbers,
  addToCart,
  error,
  setError,
  handleMobileNumberChange
}) => {
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Filter for products containing "OTHERS" in their name
    if (Array.isArray(products)) {
      setLoading(true);
      
      // Filter products with "OTHERS" in their name, excluding PREMIUM products
      const otherProducts = products.filter(
        (product) => 
          product.name?.includes("OTHERS") && 
          !product.name?.includes("PREMIUM")
      );
      
      setFilteredProducts1(otherProducts);
      setLoading(false);
    }
  }, [products, setFilteredProducts1]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <svg
          className="animate-spin h-10 w-10 text-blue-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8z"
          ></path>
        </svg>
      </div>
    );
  }

  return null; // This component doesn't render anything itself, it just filters the products
};

export default OtherProducts;