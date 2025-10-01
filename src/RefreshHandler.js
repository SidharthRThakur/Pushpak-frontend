// frontend/src/RefreshHandler.js
import  { useEffect } from "react";
import PropTypes from "prop-types";
import { useLocation, useNavigate } from "react-router-dom";

function RefreshHandler({ setisAuthenticated }) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("token")) {
      setisAuthenticated(true);
      if (
        location.pathname === "/" ||
        location.pathname === "/login" ||
        location.pathname === "/signup"
      ) {
        navigate("/home", { replace: false }); // fixed: use lowercase /home
      }
    }
  }, [location, navigate, setisAuthenticated]);

  return null;
}

RefreshHandler.propTypes = {
  setisAuthenticated: PropTypes.func.isRequired,
};

export default RefreshHandler;
