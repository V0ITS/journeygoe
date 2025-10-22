import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, LogOut, Mail } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Profil = () => {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      
      if (session.user.email) {
        setUserEmail(session.user.email);
      }
    };
    
    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast.success("Logout berhasil!");
      navigate("/login");
    } catch (error: any) {
      toast.error(error.message || "Gagal logout");
    } finally {
      setLoading(false);
    }
  };

  const clearAllData = () => {
    localStorage.removeItem("journeygo_plans");
    localStorage.removeItem("journeygo_estimates");
    toast.success("Semua data lokal berhasil dihapus!");
  };

  return (
    <div className="min-h-screen travel-gradient pb-24">
      <div className="max-w-screen-xl mx-auto p-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-primary text-primary-foreground p-3 rounded-full">
            <User size={24} />
          </div>
          <h1 className="text-3xl font-bold text-primary">Profil</h1>
        </div>

        <Card className="card-travel mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-secondary p-4 rounded-full">
              <User size={40} className="text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-primary">
                {userEmail.split("@")[0].charAt(0).toUpperCase() + userEmail.split("@")[0].slice(1)}
              </h2>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail size={16} />
                <span>{userEmail}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center py-3 border-b border-border">
              <span className="text-muted-foreground">Status Akun</span>
              <span className="text-green-600 font-medium">Aktif</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-border">
              <span className="text-muted-foreground">Member Sejak</span>
              <span className="font-medium">2024</span>
            </div>
          </div>
        </Card>

        <Card className="card-travel mb-6">
          <h3 className="text-lg font-semibold mb-4 text-primary">
            Data Tersimpan
          </h3>
          <p className="text-muted-foreground mb-4">
            Hapus semua rencana dan estimasi yang tersimpan di perangkat ini.
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={clearAllData}
          >
            Hapus Semua Data Lokal
          </Button>
        </Card>

        <Card className="card-travel">
          <h3 className="text-lg font-semibold mb-4 text-primary">
            Tentang JourneyGo
          </h3>
          <p className="text-muted-foreground mb-4 leading-relaxed">
            JourneyGo adalah aplikasi AI Smart Travel Planner & Budget Assistant 
            yang membantu Anda merencanakan perjalanan impian dengan mudah dan efisien. 
            Kami menyediakan fitur estimasi biaya, perbandingan rencana, dan visualisasi 
            budget untuk memastikan liburan Anda berjalan sempurna.
          </p>
          <p className="text-sm text-muted-foreground">
            Version 1.0.0 - MVP
          </p>
        </Card>

        <Button
          onClick={handleLogout}
          disabled={loading}
          variant="destructive"
          className="w-full mt-6"
        >
          <LogOut className="mr-2" size={20} />
          {loading ? "Loading..." : "Logout"}
        </Button>
      </div>
      <BottomNav />
    </div>
  );
};

export default Profil;
