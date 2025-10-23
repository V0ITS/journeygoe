import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
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
  total_cost?: number;
  cost_breakdown?: any;
}

const Estimasi = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [selectedPlanData, setSelectedPlanData] = useState<Plan | null>(null);

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

  useEffect(() => {
    if (selectedPlan) {
      const plan = plans.find((p) => p.id === selectedPlan);
      setSelectedPlanData(plan || null);
    } else {
      setSelectedPlanData(null);
    }
  }, [selectedPlan, plans]);

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const costBreakdown = selectedPlanData?.cost_breakdown || null;

  const chartData = costBreakdown
    ? [
        { name: "Transportasi", value: costBreakdown.transportation || 0 },
        { name: "Akomodasi", value: costBreakdown.accommodation || 0 },
        { name: "Makanan", value: costBreakdown.food || 0 },
        { name: "Aktivitas", value: costBreakdown.activities || 0 },
      ].filter(item => item.value > 0)
    : [];

  const barChartData = chartData.map(item => ({
    ...item,
    valueInMillion: item.value / 1000000
  }));

  const COLORS = ["#C69C6D", "#F5E9DA", "#8B6B4A", "#D4B896"];

  return (
    <div className="min-h-screen travel-gradient pb-24">
      <div className="max-w-screen-xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-6"
        >
          <div className="bg-primary text-primary-foreground p-3 rounded-full">
            <DollarSign size={24} />
          </div>
          <h1 className="text-3xl font-bold text-primary">Estimasi Biaya</h1>
        </motion.div>

        {plans.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="card-travel text-center py-12">
              <p className="text-muted-foreground mb-4">
                Anda belum memiliki rencana dengan estimasi AI. Buat rencana terlebih dahulu!
              </p>
              <Button onClick={() => navigate("/rencana")} className="btn-primary">
                Buat Rencana
              </Button>
            </Card>
          </motion.div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="card-travel mb-8">
                <h2 className="text-xl font-semibold mb-4 text-primary">
                  Pilih Rencana
                </h2>
                <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih rencana liburan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.destination} - {plan.duration} hari ({plan.people_count} orang)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Card>
            </motion.div>

            {selectedPlanData && costBreakdown && (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="card-travel mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-primary">
                      Rincian Biaya - {selectedPlanData.destination}
                    </h2>
                    <div className="space-y-3">
                      {costBreakdown.transportation > 0 && (
                        <div className="flex justify-between items-center py-2 border-b border-border">
                          <span className="text-muted-foreground">🚗 Transportasi:</span>
                          <span className="font-semibold">{formatRupiah(costBreakdown.transportation)}</span>
                        </div>
                      )}
                      {costBreakdown.accommodation > 0 && (
                        <div className="flex justify-between items-center py-2 border-b border-border">
                          <span className="text-muted-foreground">🏨 Akomodasi:</span>
                          <span className="font-semibold">{formatRupiah(costBreakdown.accommodation)}</span>
                        </div>
                      )}
                      {costBreakdown.food > 0 && (
                        <div className="flex justify-between items-center py-2 border-b border-border">
                          <span className="text-muted-foreground">🍽️ Makanan:</span>
                          <span className="font-semibold">{formatRupiah(costBreakdown.food)}</span>
                        </div>
                      )}
                      {costBreakdown.activities > 0 && (
                        <div className="flex justify-between items-center py-2 border-b border-border">
                          <span className="text-muted-foreground">🎭 Aktivitas:</span>
                          <span className="font-semibold">{formatRupiah(costBreakdown.activities)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center py-4 text-lg">
                        <span className="font-bold text-primary">Total:</span>
                        <span className="font-bold text-primary text-2xl">
                          {formatRupiah(costBreakdown.total)}
                        </span>
                      </div>
                    </div>
                  </Card>
                </motion.div>

                {/* Pie Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card className="card-travel mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-primary">
                      Visualisasi Estimasi Biaya (Pie Chart)
                    </h2>
                    <ResponsiveContainer width="100%" height={350}>
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => {
                            const percent = ((entry.value / costBreakdown.total) * 100).toFixed(0);
                            return `${entry.name}: ${percent}%`;
                          }}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatRupiah(Number(value))} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Card>
                </motion.div>

                {/* Bar Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Card className="card-travel">
                    <h2 className="text-xl font-semibold mb-4 text-primary">
                      Perbandingan Biaya (Bar Chart)
                    </h2>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={barChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis label={{ value: 'Juta Rupiah', angle: -90, position: 'insideLeft' }} />
                        <Tooltip formatter={(value) => `${Number(value).toFixed(2)} Juta`} />
                        <Legend />
                        <Bar dataKey="valueInMillion" fill="#C69C6D" name="Biaya (Juta Rp)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                </motion.div>
              </>
            )}

            {selectedPlanData && !costBreakdown && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="card-travel text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    Rencana ini belum memiliki estimasi biaya dari AI.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Silakan buat rencana baru dengan fitur AI Recommendation untuk mendapatkan estimasi biaya otomatis.
                  </p>
                </Card>
              </motion.div>
            )}
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default Estimasi;
