import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, LogOut, Trash2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import { motion } from "framer-motion";

const Profil = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [favoriteStyle, setFavoriteStyle] = useState("Standar");

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (!user) {
        navigate("/login");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData);
        setFullName(profileData.full_name || "");
        setFavoriteStyle(profileData.favorite_style || "Standar");
      }
    };
    getUser();
  }, [navigate]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          favorite_style: favoriteStyle,
        })
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Profil berhasil diperbarui");
    } catch (error: any) {
      toast.error("Gagal memperbarui profil");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Berhasil logout");
    navigate("/login");
  };

  const handleClearData = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from("travel_plans")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;
      toast.success("Data rencana berhasil dihapus");
    } catch (error: any) {
      toast.error("Gagal menghapus data");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen travel-gradient pb-20">
      <div className="container mx-auto px-4 py-8">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-primary mb-8"
        >
          Profil Saya
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 card-travel mb-6">
            <div className="flex items-center gap-4 mb-6">
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt="Avatar" 
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="bg-primary text-primary-foreground p-4 rounded-full">
                  <User size={40} />
                </div>
              )}
              <div>
                <h2 className="text-xl font-semibold">{profile?.full_name || user?.email}</h2>
                <p className="text-muted-foreground">{user?.email}</p>
                <p className="text-sm text-muted-foreground">
                  Member sejak {new Date(user?.created_at || Date.now()).toLocaleDateString('id-ID')}
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <Label htmlFor="fullName">Nama Lengkap</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Masukkan nama lengkap"
                />
              </div>

              <div>
                <Label htmlFor="favoriteStyle">Gaya Liburan Favorit</Label>
                <Select value={favoriteStyle} onValueChange={setFavoriteStyle}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hemat">💰 Hemat</SelectItem>
                    <SelectItem value="Standar">⭐ Standar</SelectItem>
                    <SelectItem value="Premium">👑 Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full"
                onClick={handleUpdateProfile}
                disabled={loading}
              >
                <Save className="mr-2" size={20} />
                {loading ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleClearData}
              >
                <Trash2 className="mr-2" size={20} />
                Hapus Semua Rencana
              </Button>

              <Button
                variant="destructive"
                className="w-full"
                onClick={handleLogout}
              >
                <LogOut className="mr-2" size={20} />
                Logout
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Profil;
