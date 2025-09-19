import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Drum, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoSrc from "/logo.png";

export default function Navigation() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: "/", label: "Home" },
    { path: "/about", label: "About" },
    { path: "/instagram", label: "Regional Groups" },
    { path: "/theory", label: "Theory" },
    { path: "/instruments", label: "Instruments" },
    { path: "/protest-beats", label: "Protest Beats" },
    { path: "/tunes", label: "Tunes" },
    { path: "/experiment", label: "Create Your Own" },
    { path: "/shop", label: "Shop" },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  return (
    <nav className="bg-gradient-to-r from-gray-900 via-black to-gray-900 shadow-2xl sticky top-0 z-50 border-b border-gray-700 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center space-x-2 md:space-x-3 text-white hover:text-white transition-all duration-300 hover:scale-105"
            >
              <img
                src={logoSrc}
                alt="Drummers For Palestine"
                className="h-8 md:h-10 w-auto drop-shadow-lg"
              />
              <h1 className="street-text text-lg md:text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Drummers For Palestine
              </h1>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-6 lg:ml-10 flex items-baseline space-x-2 lg:space-x-4">
              {navItems.map((item) => (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant={isActive(item.path) ? "default" : "ghost"}
                    size="sm"
                    className={
                      isActive(item.path)
                        ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-600/30 border border-red-500 transform hover:scale-105 transition-all duration-200"
                        : "text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-gray-700 hover:to-gray-600 transition-all duration-200 hover:shadow-lg"
                    }
                  >
                    {item.label}
                  </Button>
                </Link>
              ))}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-400 hover:text-white"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden animate-in slide-in-from-top duration-200">
          <div className="px-3 pt-2 pb-4 space-y-2 bg-gradient-to-b from-gray-900 via-black to-gray-900 border-t border-gray-700 shadow-2xl">
            {navItems.map((item, index) => (
              <Link key={item.path} href={item.path}>
                <Button
                  variant={isActive(item.path) ? "default" : "ghost"}
                  size="sm"
                  className={`w-full justify-start transform transition-all duration-200 ${
                    isActive(item.path)
                      ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-600/30 scale-105"
                      : "text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-gray-700 hover:to-gray-600 hover:scale-105"
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
