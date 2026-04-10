// src/App.tsx
import { Outlet, Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useMemo, useState } from "react";
import { cn } from "./lib/cn";
import Button from "./components/ui/Button";
import "./App.css";

import { isAuthed, clearToken } from "./lib/auth";

function Header() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const authed = useMemo(() => isAuthed(), [location.key]);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn("nav-link", isActive && "nav-link-active");

  function handleLogout() {
    clearToken();
    setOpen(false);
    navigate("/login", { replace: true });
  }

  return (
    <header className="border-b bg-white sticky top-0 z-40">
      <div className="container-prose flex items-center justify-between h-16">
        <Link to="/" className="font-bold text-xl">
          Insurely
        </Link>

        {/* desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {authed ? (
            <>
              <NavLink to="/profile" className={linkClass}>Profile</NavLink>
              <NavLink to="/policies" className={linkClass}>My Policies</NavLink>
              <NavLink to="/claims/start" className={linkClass}>Report Claim</NavLink>
              <NavLink to="/products" className={linkClass}>Products</NavLink>
              <NavLink to="/help" className={linkClass}>Help</NavLink>
              <button className="nav-link" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <NavLink to="/policies/new" className={linkClass}>Add Policy</NavLink>
              <NavLink to="/products" className={linkClass}>Products</NavLink>
              <NavLink to="/help" className={linkClass}>Help</NavLink>
              <NavLink to="/login" className={linkClass}>Login</NavLink>
            </>
          )}
        </nav>

        {/* mobile menu button */}
        <Button
          aria-label="Open Menu"
          variant="ghost"
          className="md:hidden"
          onClick={() => setOpen(!open)}
        >
          ☰
        </Button>
      </div>

      {/* mobile drawer */}
      {open && (
        <div className="md:hidden border-t bg-white">
          <div className="container-prose py-3 flex flex-col gap-2">
            {authed ? (
              <>
                <NavLink to="/profile" className={linkClass} onClick={() => setOpen(false)}>Profile</NavLink>
                <NavLink to="/policies" className={linkClass} onClick={() => setOpen(false)}>My Policies</NavLink>
                <NavLink to="/claims/start" className={linkClass} onClick={() => setOpen(false)}>Report Claim</NavLink>
                <NavLink to="/products" className={linkClass} onClick={() => setOpen(false)}>Products</NavLink>
                <NavLink to="/help" className={linkClass} onClick={() => setOpen(false)}>Help</NavLink>
                <button className="nav-link text-left" onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <>
                <NavLink to="/policies/new" className={linkClass} onClick={() => setOpen(false)}>Add Policy</NavLink>
                <NavLink to="/products" className={linkClass} onClick={() => setOpen(false)}>Products</NavLink>
                <NavLink to="/help" className={linkClass} onClick={() => setOpen(false)}>Help</NavLink>
                <NavLink to="/login" className={linkClass} onClick={() => setOpen(false)}>Login</NavLink>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t mt-16 bg-white">
      <div className="container-prose py-8 text-sm text-slate-600 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <p>© {new Date().getFullYear()} Insurely. All rights reserved.</p>
        <nav className="flex gap-4">
          <a className="nav-link" href="#">Imprint</a>
          <a className="nav-link" href="#">Privacy</a>
        </nav>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
