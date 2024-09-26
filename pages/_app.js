import { useEffect, useState } from "react";
import "../styles/globals.css";

function MyApp({ Component, pageProps }) {
  // Set the theme directly to dark without any toggle functionality
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark"; // Default to dark theme
    document.documentElement.className = savedTheme; // Set initial theme
  }, []);

  return (
    <div>
      <Component {...pageProps} />
    </div>
  );
}

export default MyApp;
