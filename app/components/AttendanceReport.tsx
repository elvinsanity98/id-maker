"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  attendanceToCsv,
  downloadCsv,
  queryAttendance,
  type AttendanceFilter,
  type AttendanceRow,
} from "@/lib/attendance";

const today = () => new Date().toISOString().slice(0, 10);

export default function AttendanceReport() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState<AttendanceFilter["status"]>("");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await queryAttendance({ from, to, status, search });
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    setRows(data);
  }, [from, to, status, search]);

  // Initial load (all rows).
  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = useMemo(() => {
    const c = { present: 0, late: 0, absent: 0 };
    rows.forEach((r) => {
      c[r.status] = (c[r.status] ?? 0) + 1;
    });
    return c;
  }, [rows]);

  const clearFilters = () => {
    setFrom("");
    setTo("");
    setStatus("");
    setSearch("");
  };

  const exportCsv = () => {
    if (rows.length === 0) return;
    downloadCsv(`attendance-${today()}.csv`, attendanceToCsv(rows));
  };

  return (
    <section className="bg-white rounded-xl shadow-sm p-5">
      {/* Filters */}
      <div className="no-print grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-4">
        <label className="text-xs font-medium text-slate-600">
          From
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md text-sm bg-white text-slate-900"
          />
        </label>
        <label className="text-xs font-medium text-slate-600">
          To
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md text-sm bg-white text-slate-900"
          />
        </label>
        <label className="text-xs font-medium text-slate-600">
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as AttendanceFilter["status"])}
            className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md text-sm bg-white text-slate-900"
          >
            <option value="">All</option>
            <option value="present">Present</option>
            <option value="late">Late</option>
            <option value="absent">Absent</option>
          </select>
        </label>
        <label className="text-xs font-medium text-slate-600">
          Search name / LRN
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run()}
            placeholder="e.g. Galano or 1234…"
            className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md text-sm bg-white text-slate-900 placeholder-slate-400"
          />
        </label>
      </div>

      <div className="no-print flex flex-wrap gap-2 mb-4">
        <button onClick={run} className="px-4 py-2 bg-blue-600 text-white rounded-md font-semibold text-sm hover:bg-blue-700">
          {loading ? "Loading…" : "Apply filters"}
        </button>
        <button onClick={clearFilters} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md font-semibold text-sm hover:bg-slate-300">
          Clear
        </button>
        <button onClick={exportCsv} disabled={rows.length === 0} className="px-4 py-2 bg-emerald-600 text-white rounded-md font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50">
          ⬇ Export CSV
        </button>
        <button onClick={() => window.print()} disabled={rows.length === 0} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md font-semibold text-sm hover:bg-slate-50 disabled:opacity-50">
          🖨 Print
        </button>
      </div>

      {/* Summary */}
      <div className="flex flex-wrap gap-3 mb-4 text-sm">
        <Pill label="Total" value={rows.length} cls="bg-slate-100 text-slate-700" />
        <Pill label="Present" value={counts.present} cls="bg-emerald-100 text-emerald-800" />
        <Pill label="Late" value={counts.late} cls="bg-amber-100 text-amber-800" />
        <Pill label="Absent" value={counts.absent} cls="bg-red-100 text-red-800" />
      </div>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2 mb-3">{error}</div>
      )}

      {/* Table */}
      {rows.length === 0 ? (
        <p className="text-sm text-slate-400 italic py-6 text-center">No records match.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">LRN</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Source</th>
                <th className="py-2 pr-3">Date</th>
                <th className="py-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const d = new Date(r.scanned_at);
                return (
                  <tr key={r.id} className="border-b border-slate-100">
                    <td className="py-1.5 pr-3 font-medium text-slate-800">{r.student_name ?? "—"}</td>
                    <td className="py-1.5 pr-3 font-mono text-xs text-slate-600">{r.student_lrn}</td>
                    <td className="py-1.5 pr-3">
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        r.status === "present"
                          ? "bg-emerald-100 text-emerald-800"
                          : r.status === "late"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-1.5 pr-3 text-slate-500">{r.source ?? "—"}</td>
                    <td className="py-1.5 pr-3 text-slate-600">{d.toLocaleDateString()}</td>
                    <td className="py-1.5 text-slate-600">{d.toLocaleTimeString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Pill({ label, value, cls }: { label: string; value: number; cls: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold ${cls}`}>
      {label}: {value}
    </span>
  );
}
