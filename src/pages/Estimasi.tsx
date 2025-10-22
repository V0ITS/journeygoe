import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Save } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Plan {
  id: string;
  destinasi: string;
  durasi: number;
  jumlahOrang: number;
  gaya: string;
}

interface Estimate {
  transportasi: number;
  penginapan: number;
  makanan: number;
  hiburan: number;
  total: number;
}

const Estimasi = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
    };
    
    checkAuth();
    loadPlans();
  }, [navigate]);

  const loadPlans = () => {
    const savedPlans = localStorage.getItem("journeygo_plans");
    if (savedPlans) {
      setPlans(JSON.parse(savedPlans));
    }
  };

  const calculateEstimate = () => {
    setCalculating(true);
    
    const plan = plans.find((p) => p.id === selectedPlan);
    if (!plan) return;

    // Simulate calculation delay
    setTimeout(() => {
      let multiplier = 1;
      if (plan.gaya === "hemat") multiplier = 0.7;
      if (plan.gaya === "mewah") multiplier = 1.5;

      const transportasi = 200000 * plan.jumlahOrang * multiplier;
      const penginapan = 350000 * plan.durasi * multiplier;
      const makanan = 150000 * plan.jumlahOrang * plan.durasi * multiplier;
      const hiburan = 100000 * plan.jumlahOrang * multiplier;
      const total = transportasi + penginapan + makanan + hiburan;

      const newEstimate = {
        transportasi,
        penginapan,
        makanan,
        hiburan,
        total,
      };

      setEstimate(newEstimate);
      setCalculating(false);
      toast.success("Estimasi berhasil dihitung!");
    }, 2000);
  };

  const saveEstimate = () => {
    if (!estimate || !selectedPlan) return;

    const plan = plans.find((p) => p.id === selectedPlan);
    if (!plan) return;

    const savedEstimates = JSON.parse(localStorage.getItem("journeygo_estimates") || "[]");
    const newEstimate = {
      id: Date.now().toString(),
      planId: selectedPlan,
      planName: plan.destinasi,
      ...estimate,
      createdAt: new Date().toISOString(),
    };

    savedEstimates.push(newEstimate);
    localStorage.setItem("journeygo_estimates", JSON.stringify(savedEstimates));
    toast.success("Estimasi berhasil disimpan!");
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const chartData = estimate
    ? [
        { name: "Transportasi", value: estimate.transportasi },
        { name: "Penginapan", value: estimate.penginapan },
        { name: "Makanan", value: estimate.makanan },
        { name: "Hiburan", value: estimate.hiburan },
      ]
    : [];

  const COLORS = ["#C69C6D", "#F5F0E1", "#D9D9D9", "#B78C5C"];

  return (
    <div className="min-h-screen travel-gradient pb-24">
      <div className="max-w-screen-xl mx-auto p-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-primary text-primary-foreground p-3 rounded-full">
            <DollarSign size={24} />
          </div>
          <h1 className="text-3xl font-bold text-primary">Estimasi Biaya</h1>
        </div>

        {plans.length === 0 ? (
          <Card className="card-travel text-center py-12">
            <p className="text-muted-foreground mb-4">
              Anda belum memiliki rencana. Buat rencana terlebih dahulu!
            </p>
            <Button onClick={() => navigate("/rencana")} className="btn-primary">
              Buat Rencana
            </Button>
          </Card>
        ) : (
          <>
            <Card className="card-travel mb-8">
              <h2 className="text-xl font-semibold mb-4 text-primary">
                Pilih Rencana
              </h2>
              <div className="space-y-4">
                <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih rencana liburan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.destinasi} - {plan.durasi} hari ({plan.jumlahOrang} orang)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  onClick={calculateEstimate}
                  disabled={!selectedPlan || calculating}
                  className="w-full btn-primary"
                >
                  {calculating ? "Menghitung..." : "Hitung Biaya"}
                </Button>
              </div>
            </Card>

            {estimate && (
              <>
                <Card className="card-travel mb-8 animate-slide-up">
                  <h2 className="text-xl font-semibold mb-4 text-primary">
                    Rincian Biaya
                  </h2>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-muted-foreground">Transportasi:</span>
                      <span className="font-semibold">{formatRupiah(estimate.transportasi)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-muted-foreground">Penginapan:</span>
                      <span className="font-semibold">{formatRupiah(estimate.penginapan)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-muted-foreground">Makanan:</span>
                      <span className="font-semibold">{formatRupiah(estimate.makanan)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-muted-foreground">Hiburan:</span>
                      <span className="font-semibold">{formatRupiah(estimate.hiburan)}</span>
                    </div>
                    <div className="flex justify-between items-center py-4 text-lg">
                      <span className="font-bold text-primary">Total:</span>
                      <span className="font-bold text-primary text-2xl">
                        {formatRupiah(estimate.total)}
                      </span>
                    </div>
                  </div>

                  <Button onClick={saveEstimate} className="w-full btn-primary mt-4">
                    <Save className="mr-2" size={20} />
                    Simpan Estimasi
                  </Button>
                </Card>

                <Card className="card-travel animate-slide-up" style={{ animationDelay: "100ms" }}>
                  <h2 className="text-xl font-semibold mb-4 text-primary">
                    Visualisasi Estimasi Biaya Liburan Anda
                  </h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${((entry.value / estimate.total) * 100).toFixed(0)}%`}
                        outerRadius={80}
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
              </>
            )}
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default Estimasi;
