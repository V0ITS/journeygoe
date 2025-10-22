import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plane } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Plan {
  id: string;
  destinasi: string;
  durasi: number;
  jumlahOrang: number;
  gaya: string;
  createdAt: string;
}

const Rencana = () => {
  const navigate = useNavigate();
  const [destinasi, setDestinasi] = useState("");
  const [durasi, setDurasi] = useState("");
  const [jumlahOrang, setJumlahOrang] = useState("");
  const [gaya, setGaya] = useState("santai");
  const [plans, setPlans] = useState<Plan[]>([]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newPlan: Plan = {
      id: Date.now().toString(),
      destinasi,
      durasi: parseInt(durasi),
      jumlahOrang: parseInt(jumlahOrang),
      gaya,
      createdAt: new Date().toISOString(),
    };

    const updatedPlans = [...plans, newPlan];
    localStorage.setItem("journeygo_plans", JSON.stringify(updatedPlans));
    setPlans(updatedPlans);
    
    toast.success("Rencana berhasil disimpan!");
    
    // Reset form
    setDestinasi("");
    setDurasi("");
    setJumlahOrang("");
    setGaya("santai");
  };

  const handleDelete = (id: string) => {
    const updatedPlans = plans.filter((plan) => plan.id !== id);
    localStorage.setItem("journeygo_plans", JSON.stringify(updatedPlans));
    setPlans(updatedPlans);
    toast.success("Rencana berhasil dihapus!");
  };

  return (
    <div className="min-h-screen travel-gradient pb-24">
      <div className="max-w-screen-xl mx-auto p-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-primary text-primary-foreground p-3 rounded-full">
            <Plane size={24} />
          </div>
          <h1 className="text-3xl font-bold text-primary">Rencana Liburan</h1>
        </div>

        {/* Form */}
        <Card className="card-travel mb-8">
          <h2 className="text-xl font-semibold mb-4 text-primary">
            Buat Rencana Baru
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="destinasi">Destinasi</Label>
              <Input
                id="destinasi"
                placeholder="Contoh: Bali, Paris, Tokyo"
                value={destinasi}
                onChange={(e) => setDestinasi(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="durasi">Lama Liburan (hari)</Label>
                <Input
                  id="durasi"
                  type="number"
                  min="1"
                  placeholder="7"
                  value={durasi}
                  onChange={(e) => setDurasi(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jumlahOrang">Jumlah Orang</Label>
                <Input
                  id="jumlahOrang"
                  type="number"
                  min="1"
                  placeholder="2"
                  value={jumlahOrang}
                  onChange={(e) => setJumlahOrang(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gaya">Gaya Liburan</Label>
              <Select value={gaya} onValueChange={setGaya}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hemat">Hemat</SelectItem>
                  <SelectItem value="santai">Santai</SelectItem>
                  <SelectItem value="mewah">Mewah</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full btn-primary">
              Simpan Rencana
            </Button>
          </form>
        </Card>

        {/* List of Plans */}
        {plans.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-primary">Rencana Tersimpan</h2>
            {plans.map((plan, index) => (
              <Card
                key={plan.id}
                className="card-travel animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-primary mb-2">
                      {plan.destinasi}
                    </h3>
                    <div className="space-y-1 text-muted-foreground">
                      <p>Durasi: {plan.durasi} hari</p>
                      <p>Jumlah: {plan.jumlahOrang} orang</p>
                      <p className="capitalize">Gaya: {plan.gaya}</p>
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
            ))}
          </div>
        )}

        {plans.length === 0 && (
          <Card className="card-travel text-center py-12">
            <p className="text-muted-foreground">
              Belum ada rencana tersimpan. Buat rencana pertama Anda!
            </p>
          </Card>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default Rencana;
