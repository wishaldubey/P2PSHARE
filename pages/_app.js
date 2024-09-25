import { useEffect, useState } from "react";
import "../styles/globals.css";

function MyApp({ Component, pageProps }) {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.documentElement.className = savedTheme; // Set initial theme
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.className = newTheme; // Update the theme in the DOM
  };

  return (
    <div>
      <button
        onClick={toggleTheme}
        className="fixed top-5 right-5 bg-gray-200 dark:bg-gray-700 p-2 rounded-md transition-colors"
      >
        Toggle Theme
      </button>
      <Component {...pageProps} />
    </div>
  );
}

export default MyApp;
