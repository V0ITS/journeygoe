import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Map, DollarSign, GitCompare, Plane, Sparkles } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { toast } from "sonner";

const Dashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Traveler");
  const [profile, setProfile] = useState<any>(null);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData);
        setUserName(profileData.full_name || session.user.email?.split("@")[0] || "Traveler");
        
        // Load AI suggestions based on favorite style
        if (profileData.favorite_style) {
          loadAISuggestions(profileData.favorite_style);
        }
      } else if (session.user.email) {
        const name = session.user.email.split("@")[0];
        setUserName(name.charAt(0).toUpperCase() + name.slice(1));
      }
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/login");
      }
    });
    
    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadAISuggestions = async (style: string) => {
    setLoadingSuggestions(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-travel-recommendation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
          },
          body: JSON.stringify({
            style,
            type: 'suggestion'
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAiSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error("Error loading AI suggestions:", error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

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
      <div className="max-w-screen-xl mx-auto p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
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
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className="card-travel cursor-pointer group"
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
              </motion.div>
            );
          })}
        </div>

        {/* AI Smart Suggestions */}
        {profile?.favorite_style && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="card-travel mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="text-primary" size={24} />
                <h3 className="text-lg font-semibold text-primary">
                  AI Smart Suggestion untuk Anda
                </h3>
              </div>
              <p className="text-muted-foreground mb-4">
                Berdasarkan gaya liburan favorit Anda ({profile.favorite_style}), kami merekomendasikan:
              </p>

              {loadingSuggestions ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="text-muted-foreground mt-2">Memuat rekomendasi AI...</p>
                </div>
              ) : aiSuggestions.length > 0 ? (
                <div className="space-y-4">
                  {aiSuggestions.map((suggestion, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border border-border rounded-lg p-4 hover:bg-secondary/20 transition-colors"
                    >
                      <h4 className="font-semibold text-lg mb-2">{suggestion.destination}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{suggestion.reason}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-primary font-semibold">
                          {formatRupiah(suggestion.estimatedCost)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {suggestion.duration} hari
                        </span>
                      </div>
                      {suggestion.highlights && suggestion.highlights.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {suggestion.highlights.map((highlight: string, i: number) => (
                            <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                              {highlight}
                            </span>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <Button 
                  onClick={() => profile.favorite_style && loadAISuggestions(profile.favorite_style)}
                  className="w-full"
                >
                  Muat Rekomendasi AI
                </Button>
              )}
            </Card>
          </motion.div>
        )}

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="card-travel">
            <h3 className="text-lg font-semibold mb-3 text-primary">
              Tentang JourneyGo
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              JourneyGo membantu Anda merencanakan perjalanan dengan mudah dan efisien. 
              Buat rencana perjalanan, estimasi biaya, dan bandingkan berbagai opsi untuk 
              menemukan pilihan terbaik untuk liburan impian Anda.
            </p>
          </Card>
        </motion.div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Dashboard;
