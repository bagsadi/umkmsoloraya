import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

var API = String(process.env.REACT_APP_BACKEND_URL) + "/api";
var AuthContext = createContext(null);

export function getAuthHeaders() {
  var token = localStorage.getItem("auth_token");
  if (token) return { Authorization: "Bearer " + token };
  return {};
}

export function AuthProvider(props) {
  var children = props.children;
  var ref1 = useState(null);
  var user = ref1[0];
  var setUser = ref1[1];
  var ref2 = useState(true);
  var loading = ref2[0];
  var setLoading = ref2[1];

  var checkAuth = useCallback(function() {
    var token = localStorage.getItem("auth_token");
    if (!token) {
      setUser(false);
      setLoading(false);
      return;
    }
    axios.get(API + "/auth/me", {
      headers: { Authorization: "Bearer " + token }
    }).then(function(res) {
      if (res.data && res.data.email) {
        var u = Object.assign({}, res.data);
        u.token = token;
        setUser(u);
      } else {
        localStorage.removeItem("auth_token");
        setUser(false);
      }
    }).catch(function() {
      localStorage.removeItem("auth_token");
      setUser(false);
    }).finally(function() {
      setLoading(false);
    });
  }, []);

  useEffect(function() { checkAuth(); }, [checkAuth]);

  var login = function(email, password) {
    return axios.post(API + "/auth/login", {
      email: email,
      password: password
    }).then(function(res) {
      if (res.data.token) {
        localStorage.setItem("auth_token", res.data.token);
      }
      setUser(res.data);
      return res.data;
    });
  };

  var logout = function() {
    var headers = getAuthHeaders();
    return axios.post(API + "/auth/logout", {}, { headers: headers })
      .catch(function() {})
      .then(function() {
        localStorage.removeItem("auth_token");
        setUser(false);
      });
  };

  return React.createElement(
    AuthContext.Provider,
    { value: { user: user, loading: loading, login: login, logout: logout, checkAuth: checkAuth } },
    children
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
