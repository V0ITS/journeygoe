import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plane, Sparkles, Calendar, Users } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface Plan {
  id: string;
  destination: string;
  duration: number;
  people_count: number;
  travel_style: string;
  ai_recommendation?: any;
  total_cost?: number;
  created_at: string;
}

const Rencana = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [destinasi, setDestinasi] = useState("");
  const [durasi, setDurasi] = useState("");
  const [jumlahOrang, setJumlahOrang] = useState("");
  const [gaya, setGaya] = useState("Standar");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      setUserId(session.user.id);
    };
    
    checkAuth();
    loadPlans();
  }, [navigate]);

  const loadPlans = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("travel_plans")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading plans:", error);
      return;
    }

    if (data) {
      setPlans(data);
    }
  };

  const getAIRecommendation = async () => {
    if (!destinasi || !durasi || !jumlahOrang) {
      toast.error("Mohon lengkapi semua field terlebih dahulu");
      return;
    }

    setLoadingAI(true);
    setRetryCount(0);

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
            destination: destinasi,
            duration: parseInt(durasi),
            people: parseInt(jumlahOrang),
            style: gaya,
            type: 'recommendation'
          })
        }
      );

      if (!response.ok) {
        throw new Error("Gagal mendapatkan rekomendasi AI");
      }

      const data = await response.json();
      
      if (data.error) {
        if (data.retry && retryCount < 1) {
          setRetryCount(retryCount + 1);
          toast.error("⚠️ Gagal memuat hasil AI, mencoba ulang otomatis...");
          setTimeout(() => getAIRecommendation(), 2000);
          return;
        }
        throw new Error(data.error);
      }

      setAiRecommendation(data);
      toast.success("Rekomendasi AI berhasil dimuat!");
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan saat memuat AI");
      console.error("AI Error:", error);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      toast.error("User tidak ditemukan");
      return;
    }

    try {
      const totalCost = aiRecommendation?.costBreakdown?.total || 0;

      const { error } = await supabase
        .from("travel_plans")
        .insert({
          user_id: userId,
          destination: destinasi,
          duration: parseInt(durasi),
          people_count: parseInt(jumlahOrang),
          travel_style: gaya,
          ai_recommendation: aiRecommendation,
          total_cost: totalCost,
          cost_breakdown: aiRecommendation?.costBreakdown || null
        });

      if (error) throw error;

      toast.success("Rencana berhasil disimpan!");
      loadPlans();
      
      // Reset form
      setDestinasi("");
      setDurasi("");
      setJumlahOrang("");
      setGaya("Standar");
      setAiRecommendation(null);
    } catch (error: any) {
      toast.error("Gagal menyimpan rencana");
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("travel_plans")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Rencana berhasil dihapus!");
      loadPlans();
    } catch (error: any) {
      toast.error("Gagal menghapus rencana");
      console.error(error);
    }
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen travel-gradient pb-24">
      <div className="max-w-screen-xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-6"
        >
          <div className="bg-primary text-primary-foreground p-3 rounded-full">
            <Plane size={24} />
          </div>
          <h1 className="text-3xl font-bold text-primary">Rencana Liburan</h1>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="card-travel mb-8">
            <h2 className="text-xl font-semibold mb-4 text-primary">
              Buat Rencana Baru
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="destinasi">Destinasi</Label>
                <Input
                  id="destinasi"
                  placeholder="Contoh: Bali, Yogyakarta, Raja Ampat"
                  value={destinasi}
                  onChange={(e) => setDestinasi(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="durasi">Lama Liburan (hari)</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 text-muted-foreground" size={18} />
                    <Input
                      id="durasi"
                      type="number"
                      min="1"
                      placeholder="7"
                      value={durasi}
                      onChange={(e) => setDurasi(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jumlahOrang">Jumlah Orang</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-3 text-muted-foreground" size={18} />
                    <Input
                      id="jumlahOrang"
                      type="number"
                      min="1"
                      placeholder="2"
                      value={jumlahOrang}
                      onChange={(e) => setJumlahOrang(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gaya">Gaya Liburan</Label>
                <Select value={gaya} onValueChange={setGaya}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hemat">💰 Hemat - Budget minimal</SelectItem>
                    <SelectItem value="Standar">⭐ Standar - Budget menengah</SelectItem>
                    <SelectItem value="Premium">👑 Premium - Budget tinggi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="button"
                onClick={getAIRecommendation}
                disabled={loadingAI || !destinasi || !durasi || !jumlahOrang}
                className="w-full"
                variant="outline"
              >
                <Sparkles className="mr-2" size={20} />
                {loadingAI ? "Memuat Rekomendasi AI..." : "🎯 Dapatkan Rekomendasi AI"}
              </Button>

              {aiRecommendation && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="border border-primary/20 rounded-lg p-4 bg-primary/5"
                >
                  <h3 className="font-semibold text-lg mb-3 text-primary">Rekomendasi AI:</h3>
                  
                  {aiRecommendation.costBreakdown && (
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground mb-2">Estimasi Biaya Total:</p>
                      <p className="text-2xl font-bold text-primary">
                        {formatRupiah(aiRecommendation.costBreakdown.total)}
                      </p>
                    </div>
                  )}

                  {aiRecommendation.tips && aiRecommendation.tips.length > 0 && (
                    <div className="mb-3">
                      <p className="font-semibold mb-2 text-sm">Tips:</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {aiRecommendation.tips.slice(0, 3).map((tip: string, index: number) => (
                          <li key={index}>• {tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {aiRecommendation.alternatives && aiRecommendation.alternatives.length > 0 && (
                    <div>
                      <p className="font-semibold mb-2 text-sm">Alternatif Destinasi:</p>
                      <div className="space-y-2">
                        {aiRecommendation.alternatives.slice(0, 2).map((alt: any, index: number) => (
                          <div key={index} className="text-sm bg-background/50 p-2 rounded">
                            <p className="font-medium">{alt.destination}</p>
                            <p className="text-xs text-muted-foreground">{alt.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              <Button type="submit" className="w-full btn-primary" disabled={!aiRecommendation}>
                Simpan Rencana
              </Button>
            </form>
          </Card>
        </motion.div>

        {/* List of Plans */}
        {plans.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-primary">Rencana Tersimpan</h2>
            {plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="card-travel">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-primary mb-2">
                        {plan.destination}
                      </h3>
                      <div className="space-y-1 text-muted-foreground text-sm">
                        <p>📅 Durasi: {plan.duration} hari</p>
                        <p>👥 Jumlah: {plan.people_count} orang</p>
                        <p>✈️ Gaya: {plan.travel_style}</p>
                        {plan.total_cost && (
                          <p className="text-primary font-semibold mt-2">
                            💰 {formatRupiah(plan.total_cost)}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDelete(plan.id)}
                    >
                      <Trash2 size={20} />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {plans.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="card-travel text-center py-12">
              <p className="text-muted-foreground">
                Belum ada rencana tersimpan. Buat rencana pertama Anda!
              </p>
            </Card>
          </motion.div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default Rencana;
