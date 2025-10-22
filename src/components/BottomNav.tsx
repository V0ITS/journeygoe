import { Home, Map, DollarSign, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const BottomNav = () => {
  const location = useLocation();
  
  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/rencana", icon: Map, label: "Rencana" },
    { path: "/estimasi", icon: DollarSign, label: "Estimasi" },
    { path: "/profil", icon: User, label: "Profil" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex items-center justify-around py-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all duration-300 ${
                  isActive
                    ? "text-primary bg-secondary scale-110"
                    : "text-muted-foreground hover:text-primary hover:bg-secondary/50"
                }`}
              >
                <Icon size={24} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
