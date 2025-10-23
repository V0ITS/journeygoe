import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GitCompare, Trash2, Eye, X } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Plan {
  id: string;
  destination: string;
  duration: number;
  people_count: number;
  travel_style: string;
  total_cost?: number;
  cost_breakdown?: any;
  created_at: string;
}

const Bandingkan = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

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
      // Only show plans with cost data
      setPlans(data.filter(plan => plan.total_cost && plan.cost_breakdown));
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
      if (selectedPlan?.id === id) {
        setSelectedPlan(null);
      }
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

  // Prepare comparison data for chart
  const comparisonData = plans.slice(0, 5).map((plan, index) => ({
    name: `${plan.destination.substring(0, 10)}${plan.destination.length > 10 ? '...' : ''}`,
    Transportasi: plan.cost_breakdown?.transportation || 0,
    Akomodasi: plan.cost_breakdown?.accommodation || 0,
    Makanan: plan.cost_breakdown?.food || 0,
    Aktivitas: plan.cost_breakdown?.activities || 0,
    Total: plan.total_cost || 0,
  }));

  return (
    <div className="min-h-screen travel-gradient pb-24">
      <div className="max-w-screen-xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-6"
        >
          <div className="bg-primary text-primary-foreground p-3 rounded-full">
            <GitCompare size={24} />
          </div>
          <h1 className="text-3xl font-bold text-primary">Bandingkan Rencana</h1>
        </motion.div>

        {plans.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="card-travel text-center py-12">
              <p className="text-muted-foreground mb-4">
                Belum ada rencana dengan estimasi biaya. Buat rencana dengan AI terlebih dahulu!
              </p>
              <Button onClick={() => navigate("/rencana")} className="btn-primary">
                Buat Rencana
              </Button>
            </Card>
          </motion.div>
        ) : plans.length === 1 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="card-travel text-center py-12">
              <p className="text-muted-foreground mb-4">
                Anda memiliki 1 rencana. Buat minimal 2 rencana untuk membandingkan!
              </p>
              <Button onClick={() => navigate("/rencana")} className="btn-primary">
                Buat Rencana Lagi
              </Button>
            </Card>
          </motion.div>
        ) : (
          <>
            {/* Comparison Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="card-travel mb-8">
                <h2 className="text-xl font-semibold mb-4 text-primary">
                  Grafik Perbandingan Biaya
                </h2>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatRupiah(Number(value))} />
                    <Legend />
                    <Bar dataKey="Transportasi" stackId="a" fill="#C69C6D" />
                    <Bar dataKey="Akomodasi" stackId="a" fill="#F5E9DA" />
                    <Bar dataKey="Makanan" stackId="a" fill="#8B6B4A" />
                    <Bar dataKey="Aktivitas" stackId="a" fill="#D4B896" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </motion.div>

            {/* Comparison Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="card-travel mb-8 overflow-x-auto">
                <h2 className="text-xl font-semibold mb-4 text-primary">
                  Tabel Perbandingan
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-muted-foreground font-semibold">
                          Destinasi
                        </th>
                        <th className="text-center py-3 px-4 text-muted-foreground font-semibold">
                          Durasi
                        </th>
                        <th className="text-center py-3 px-4 text-muted-foreground font-semibold">
                          Gaya
                        </th>
                        <th className="text-right py-3 px-4 text-muted-foreground font-semibold">
                          Total Biaya
                        </th>
                        <th className="text-center py-3 px-4 text-muted-foreground font-semibold">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {plans.map((plan, index) => (
                        <motion.tr
                          key={plan.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-border hover:bg-secondary/50 transition-colors"
                        >
                          <td className="py-3 px-4 font-medium">
                            {plan.destination}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {plan.duration} hari
                          </td>
                          <td className="py-3 px-4 text-center">
                            {plan.travel_style}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-primary">
                            {formatRupiah(plan.total_cost || 0)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2 justify-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedPlan(plan)}
                              >
                                <Eye size={16} />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(plan.id)}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>

            {/* Detail View Modal */}
            <AnimatePresence>
              {selectedPlan && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                  onClick={() => setSelectedPlan(null)}
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-2xl"
                  >
                    <Card className="card-travel">
                      <div className="flex justify-between items-start mb-4">
                        <h2 className="text-xl font-semibold text-primary">
                          Detail: {selectedPlan.destination}
                        </h2>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedPlan(null)}
                        >
                          <X size={20} />
                        </Button>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Durasi</p>
                          <p className="font-semibold">{selectedPlan.duration} hari</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Orang</p>
                          <p className="font-semibold">{selectedPlan.people_count}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Gaya</p>
                          <p className="font-semibold">{selectedPlan.travel_style}</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {selectedPlan.cost_breakdown?.transportation > 0 && (
                          <div className="flex justify-between items-center py-2 border-b border-border">
                            <span className="text-muted-foreground">🚗 Transportasi:</span>
                            <span className="font-semibold">
                              {formatRupiah(selectedPlan.cost_breakdown.transportation)}
                            </span>
                          </div>
                        )}
                        {selectedPlan.cost_breakdown?.accommodation > 0 && (
                          <div className="flex justify-between items-center py-2 border-b border-border">
                            <span className="text-muted-foreground">🏨 Akomodasi:</span>
                            <span className="font-semibold">
                              {formatRupiah(selectedPlan.cost_breakdown.accommodation)}
                            </span>
                          </div>
                        )}
                        {selectedPlan.cost_breakdown?.food > 0 && (
                          <div className="flex justify-between items-center py-2 border-b border-border">
                            <span className="text-muted-foreground">🍽️ Makanan:</span>
                            <span className="font-semibold">
                              {formatRupiah(selectedPlan.cost_breakdown.food)}
                            </span>
                          </div>
                        )}
                        {selectedPlan.cost_breakdown?.activities > 0 && (
                          <div className="flex justify-between items-center py-2 border-b border-border">
                            <span className="text-muted-foreground">🎭 Aktivitas:</span>
                            <span className="font-semibold">
                              {formatRupiah(selectedPlan.cost_breakdown.activities)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center py-4 text-lg">
                          <span className="font-bold text-primary">Total:</span>
                          <span className="font-bold text-primary text-2xl">
                            {formatRupiah(selectedPlan.total_cost || 0)}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default Bandingkan;
