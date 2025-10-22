import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Map, DollarSign, GitCompare, Plane } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Traveler");

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      
      // Get user email as name
      if (session.user.email) {
        const name = session.user.email.split("@")[0];
        setUserName(name.charAt(0).toUpperCase() + name.slice(1));
      }
    };
    
    checkAuth();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/login");
      }
    });
    
    return () => subscription.unsubscribe();
  }, [navigate]);

  const menuItems = [
    {
      title: "Buat Rencana Liburan",
      description: "Rencanakan perjalanan impian Anda",
      icon: Map,
      path: "/rencana",
      color: "bg-primary",
    },
    {
      title: "Estimasi Biaya",
      description: "Hitung budget perjalanan Anda",
      icon: DollarSign,
      path: "/estimasi",
      color: "bg-accent",
    },
    {
      title: "Bandingkan Rencana",
      description: "Bandingkan rencana perjalanan",
      icon: GitCompare,
      path: "/bandingkan",
      color: "bg-secondary",
    },
  ];

  return (
    <div className="min-h-screen travel-gradient pb-24">
      <div className="max-w-screen-xl mx-auto p-6 animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-primary text-primary-foreground p-3 rounded-full">
              <Plane size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-primary">
                Welcome Back, {userName}
              </h1>
              <p className="text-muted-foreground">
                Siap merencanakan perjalanan berikutnya?
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Card
                key={index}
                className="card-travel cursor-pointer group animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => navigate(item.path)}
              >
                <div className={`${item.color} text-primary-foreground w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon size={28} />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">
                  {item.title}
                </h3>
                <p className="text-muted-foreground">{item.description}</p>
              </Card>
            );
          })}
        </div>

        {/* Info Section */}
        <Card className="card-travel mt-8">
          <h3 className="text-lg font-semibold mb-3 text-primary">
            Tentang JourneyGo
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            JourneyGo membantu Anda merencanakan perjalanan dengan mudah dan efisien. 
            Buat rencana perjalanan, estimasi biaya, dan bandingkan berbagai opsi untuk 
            menemukan pilihan terbaik untuk liburan impian Anda.
          </p>
        </Card>
      </div>
      <BottomNav />
    </div>
  );
};

export default Dashboard;
