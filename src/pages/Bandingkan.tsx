import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GitCompare, Trash2, Eye } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SavedEstimate {
  id: string;
  planId: string;
  planName: string;
  transportasi: number;
  penginapan: number;
  makanan: number;
  hiburan: number;
  total: number;
  createdAt: string;
}

const Bandingkan = () => {
  const navigate = useNavigate();
  const [estimates, setEstimates] = useState<SavedEstimate[]>([]);
  const [selectedEstimate, setSelectedEstimate] = useState<SavedEstimate | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
    };
    
    checkAuth();
    loadEstimates();
  }, [navigate]);

  const loadEstimates = () => {
    const savedEstimates = localStorage.getItem("journeygo_estimates");
    if (savedEstimates) {
      setEstimates(JSON.parse(savedEstimates));
    }
  };

  const handleDelete = (id: string) => {
    const updatedEstimates = estimates.filter((est) => est.id !== id);
    localStorage.setItem("journeygo_estimates", JSON.stringify(updatedEstimates));
    setEstimates(updatedEstimates);
    toast.success("Estimasi berhasil dihapus!");
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
      <div className="max-w-screen-xl mx-auto p-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-primary text-primary-foreground p-3 rounded-full">
            <GitCompare size={24} />
          </div>
          <h1 className="text-3xl font-bold text-primary">Bandingkan Rencana</h1>
        </div>

        {estimates.length === 0 ? (
          <Card className="card-travel text-center py-12">
            <p className="text-muted-foreground mb-4">
              Belum ada estimasi tersimpan. Buat estimasi terlebih dahulu!
            </p>
            <Button onClick={() => navigate("/estimasi")} className="btn-primary">
              Buat Estimasi
            </Button>
          </Card>
        ) : estimates.length === 1 ? (
          <Card className="card-travel text-center py-12">
            <p className="text-muted-foreground mb-4">
              Anda memiliki 1 estimasi. Buat minimal 2 estimasi untuk membandingkan!
            </p>
            <Button onClick={() => navigate("/estimasi")} className="btn-primary">
              Buat Estimasi Lagi
            </Button>
          </Card>
        ) : (
          <>
            {/* Comparison Table */}
            <Card className="card-travel mb-8 overflow-x-auto">
              <h2 className="text-xl font-semibold mb-4 text-primary">
                Tabel Perbandingan
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-muted-foreground font-semibold">
                        Rencana
                      </th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-semibold">
                        Destinasi
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
                    {estimates.map((estimate, index) => (
                      <tr
                        key={estimate.id}
                        className="border-b border-border hover:bg-secondary/50 transition-colors animate-slide-up"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <td className="py-3 px-4 font-medium">
                          Rencana {index + 1}
                        </td>
                        <td className="py-3 px-4">{estimate.planName}</td>
                        <td className="py-3 px-4 text-right font-semibold text-primary">
                          {formatRupiah(estimate.total)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2 justify-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedEstimate(estimate)}
                            >
                              <Eye size={16} />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(estimate.id)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Detail View */}
            {selectedEstimate && (
              <Card className="card-travel animate-fade-in">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-semibold text-primary">
                    Detail: {selectedEstimate.planName}
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedEstimate(null)}
                  >
                    Tutup
                  </Button>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Transportasi:</span>
                    <span className="font-semibold">
                      {formatRupiah(selectedEstimate.transportasi)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Penginapan:</span>
                    <span className="font-semibold">
                      {formatRupiah(selectedEstimate.penginapan)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Makanan:</span>
                    <span className="font-semibold">
                      {formatRupiah(selectedEstimate.makanan)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Hiburan:</span>
                    <span className="font-semibold">
                      {formatRupiah(selectedEstimate.hiburan)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-4 text-lg">
                    <span className="font-bold text-primary">Total:</span>
                    <span className="font-bold text-primary text-2xl">
                      {formatRupiah(selectedEstimate.total)}
                    </span>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default Bandingkan;
