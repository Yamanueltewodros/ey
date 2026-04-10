// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  useLocation,
} from "react-router-dom";
import "./index.css";
import App from "./App";

import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Help from "./pages/Help";
import ClaimStart from "./pages/claims/ClaimStart";
import ClaimTrack from "./pages/claims/ClaimTrack";

import PolicyRevealer from "./pages/policy/PolicyRevealer";
import PolicyAdder from "./pages/policy/PolicyAdder";

import Login from "./pages/login/Login";
import Profile from "./pages/profile/Profile";

import { getToken } from "./lib/auth";
import { patchFetch } from "./lib/fetchWithBase";

// ✅ IMPORTANT: apply fetch patch once (fixes /api in production)
patchFetch();

// ✅ Auth Guard
function RequireAuth({ children }: { children: JSX.Element }) {
  const location = useLocation();
  const token = getToken();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}

// ✅ Index redirect logic
function IndexRedirect() {
  const token = getToken();
  return token ? <Navigate to="/profile" replace /> : <Home />;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      // ✅ Dashboard opens Profile if logged in
      { index: true, element: <IndexRedirect /> },

      // public
      { path: "products", element: <Products /> },
      { path: "products/:slug", element: <ProductDetail /> },
      { path: "help", element: <Help /> },
      { path: "login", element: <Login /> },

      // protected
      {
        path: "profile",
        element: (
          <RequireAuth>
            <Profile />
          </RequireAuth>
        ),
      },
      {
        path: "policies",
        element: (
          <RequireAuth>
            <PolicyRevealer />
          </RequireAuth>
        ),
      },

      // claims (protected)
      {
        path: "claims/start",
        element: (
          <RequireAuth>
            <ClaimStart />
          </RequireAuth>
        ),
      },
      {
        path: "claims/track",
        element: (
          <RequireAuth>
            <ClaimTrack />
          </RequireAuth>
        ),
      },

      // public add policy
      { path: "policies/new", element: <PolicyAdder /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
