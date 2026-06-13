import { AlertCircle, CheckCircle, HelpCircle, RefreshCw, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../ui/button";
import { Card } from "../../ui/card";
import { ErrorState } from "../../shared/EmptyState";
import { healthApi } from "../../../api/healthApi";
import type { HealthResult } from "../../../api/types";
import { useAsyncData } from "../../../hooks/useAsyncData";
import { AdminWorkspaceLayout } from "./AdminWorkspaceLayout";

interface HealthPageProps {
  dark: boolean;
  onToggleDark: () => void;
}

function statusIcon(status: HealthResult["status"]) {
  if (status === "healthy") return <CheckCircle className="size-4 text-green-500" />;
  if (status === "down") return <XCircle className="size-4 text-red-500" />;
  return <HelpCircle className="size-4 text-slate-400" />;
}

function statusClass(status: HealthResult["status"]) {
  if (status === "healthy") return "border-l-4 border-l-green-500";
  if (status === "down") return "border-l-4 border-l-red-500";
  return "border-l-4 border-l-slate-300 dark:border-l-slate-600";
}

function statusPill(status: HealthResult["status"]) {
  if (status === "healthy") return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300";
  if (status === "down") return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
  return "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300";
}

export function HealthPage({ dark, onToggleDark }: HealthPageProps) {
  const healthState = useAsyncData(() => healthApi.all(), []);
  const services = healthState.data ?? [];
  const healthy = services.filter(s => s.status === "healthy").length;
  const down = services.filter(s => s.status === "down").length;
  const unknown = services.filter(s => s.status === "unknown").length;

  async function refresh() {
    await healthState.reload();
    toast.success("Health status refreshed");
  }

  return (
    <AdminWorkspaceLayout
      title="System Health"
      description="Service status from gateway health endpoints. Missing backend metrics are shown as N/A."
      dark={dark}
      onToggleDark={onToggleDark}
      action={
        <Button size="sm" variant="outline" className="gap-1.5" onClick={refresh} disabled={healthState.loading}>
          <RefreshCw className={`size-3.5 ${healthState.loading ? "animate-spin" : ""}`} />
          {healthState.loading ? "Refreshing..." : "Refresh"}
        </Button>
      }
    >
      <div className="space-y-6">
        {healthState.error && (
          <ErrorState
            title="Health check failed"
            description={healthState.error}
            className="rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
          />
        )}

        <div className="grid grid-cols-3 gap-4">
          <Card className="border-slate-200 bg-white p-4 text-center dark:border-slate-700 dark:bg-slate-800">
            <p className="text-2xl font-bold text-green-600">{healthy}</p>
            <p className="mt-0.5 text-xs text-slate-500">Healthy</p>
          </Card>
          <Card className="border-slate-200 bg-white p-4 text-center dark:border-slate-700 dark:bg-slate-800">
            <p className="text-2xl font-bold text-slate-500">{unknown}</p>
            <p className="mt-0.5 text-xs text-slate-500">N/A</p>
          </Card>
          <Card className="border-slate-200 bg-white p-4 text-center dark:border-slate-700 dark:bg-slate-800">
            <p className="text-2xl font-bold text-red-600">{down}</p>
            <p className="mt-0.5 text-xs text-slate-500">Down</p>
          </Card>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Services</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {(healthState.loading && services.length === 0 ? [] : services).map(service => (
              <Card
                key={service.name}
                className={`border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800 ${statusClass(service.status)}`}
              >
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {statusIcon(service.status)}
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{service.name}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusPill(service.status)}`}>
                    {service.status === "unknown" ? "N/A" : service.status}
                  </span>
                </div>
                <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">{service.message}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                  <span>{service.latency === null ? "N/A" : `${service.latency}ms`} latency</span>
                  <span>Uptime N/A</span>
                  <span>Checked {new Date(service.lastCheck).toLocaleTimeString()}</span>
                </div>
              </Card>
            ))}
            {healthState.loading && services.length === 0 && (
              <Card className="border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800">
                Loading health data...
              </Card>
            )}
          </div>
        </div>

        <div>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            <AlertCircle className="size-4 text-slate-400" />
            Queue Status
          </h2>
          <Card className="overflow-hidden border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Metric</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500">Value</th>
                </tr>
              </thead>
              <tbody>
                {["Pending jobs", "Processed jobs", "Failed jobs", "Queue latency"].map(metric => (
                  <tr key={metric} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300">{metric}</td>
                    <td className="px-4 py-2.5 text-right text-sm text-slate-400">N/A</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </AdminWorkspaceLayout>
  );
}
