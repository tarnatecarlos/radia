"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  Mail,
  Maximize,
  User,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { buildOrgTree, integrations, profiles } from "@/lib/mock-data";
import type { OrgNode } from "@/lib/types";

type LayoutMode = "top-down" | "left-right";

interface Position {
  x: number;
  y: number;
}

interface FlatNode {
  node: OrgNode;
  parentId: string | null | undefined;
}

const NODE_W = 208;
const NODE_H = 128;

function subtreeWidth(node: OrgNode, gap: number): number {
  if (!node.children.length) {
    return NODE_W;
  }
  const widths = node.children.map((child) => subtreeWidth(child, gap));
  return widths.reduce((sum, width) => sum + width, 0) + (node.children.length - 1) * gap;
}

function subtreeHeight(node: OrgNode, gap: number): number {
  if (!node.children.length) {
    return NODE_H;
  }
  const heights = node.children.map((child) => subtreeHeight(child, gap));
  return heights.reduce((sum, height) => sum + height, 0) + (node.children.length - 1) * gap;
}

function layoutTopDown(node: OrgNode, x: number, y: number, positions: Map<string, Position>) {
  const hGap = 36;
  const vGap = 150;
  positions.set(node.id, { x, y });

  if (!node.children.length) {
    return;
  }

  const totalWidth = subtreeWidth(node, hGap);
  let startX = x - totalWidth / 2;
  for (const child of node.children) {
    const width = subtreeWidth(child, hGap);
    layoutTopDown(child, startX + width / 2, y + vGap, positions);
    startX += width + hGap;
  }
}

function layoutLeftRight(node: OrgNode, x: number, y: number, positions: Map<string, Position>) {
  const hGap = 280;
  const vGap = 28;
  positions.set(node.id, { x, y });

  if (!node.children.length) {
    return;
  }

  const totalHeight = subtreeHeight(node, vGap);
  let startY = y - totalHeight / 2;
  for (const child of node.children) {
    const height = subtreeHeight(child, vGap);
    layoutLeftRight(child, x + hGap, startY + height / 2, positions);
    startY += height + vGap;
  }
}

function flattenTree(node: OrgNode, output: FlatNode[], parentId: string | null) {
  output.push({ node, parentId });
  node.children.forEach((child) => flattenTree(child as OrgNode, output, node.id));
}

const avatarColorClasses = [
  "bg-indigo-600",
  "bg-emerald-600",
  "bg-amber-600",
  "bg-rose-600",
  "bg-sky-600",
  "bg-violet-600",
  "bg-teal-600",
  "bg-slate-500",
];

function getAvatarColor(id: string) {
  const parsed = parseInt(id.replace(/\D/g, ""), 10) || 0;
  return avatarColorClasses[parsed % avatarColorClasses.length];
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0]}${lastName[0]}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getRoleTone(role: string) {
  switch (role) {
    case "creator":
      return "bg-violet-50 text-violet-700";
    case "moderator":
      return "bg-sky-50 text-sky-700";
    case "user":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function humanRole(role: string) {
  if (role === "creator") {
    return "Creator";
  }
  if (role === "moderator") {
    return "Moderator";
  }
  return "User";
}

function ConnectorLines({
  flatNodes,
  positions,
  layout,
}: {
  flatNodes: FlatNode[];
  positions: Map<string, Position>;
  layout: LayoutMode;
}) {
  return (
    <svg className="absolute inset-0 pointer-events-none overflow-visible">
      {flatNodes.map(({ node, parentId }) => {
        if (!parentId) {
          return null;
        }

        const parent = positions.get(parentId);
        const child = positions.get(node.id);
        if (!parent || !child) {
          return null;
        }

        let d = "";
        if (layout === "top-down") {
          const y1 = parent.y + NODE_H / 2;
          const y2 = child.y - NODE_H / 2;
          const middle = (y1 + y2) / 2;
          d = `M ${parent.x} ${y1} C ${parent.x} ${middle}, ${child.x} ${middle}, ${child.x} ${y2}`;
        } else {
          const x1 = parent.x + NODE_W / 2;
          const x2 = child.x - NODE_W / 2;
          const middle = (x1 + x2) / 2;
          d = `M ${x1} ${parent.y} C ${middle} ${parent.y}, ${middle} ${child.y}, ${x2} ${child.y}`;
        }

        return <path key={`${parentId}-${node.id}`} d={d} stroke="rgb(203 213 225)" strokeWidth="1.5" fill="none" />;
      })}
    </svg>
  );
}

export function OrgChartContent() {
  const root = useMemo(() => buildOrgTree(profiles) as OrgNode, []);
  const [layout, setLayout] = useState<LayoutMode>("top-down");

  const positions = useMemo(() => {
    const next = new Map<string, Position>();
    if (layout === "top-down") {
      layoutTopDown(root, 0, 0, next);
    } else {
      layoutLeftRight(root, 0, 0, next);
    }
    return next;
  }, [layout, root]);

  const flatNodes = useMemo(() => {
    const list: FlatNode[] = [];
    flattenTree(root, list, null);
    return list;
  }, [root]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState({ x: 0, y: 0, z: 1 });

  const canvasRef = useRef<HTMLDivElement>(null);
  const panRef = useRef<{ mouseX: number; mouseY: number; viewX: number; viewY: number } | null>(null);

  const selectedPerson = selectedId ? profiles.find((profile) => profile.id === selectedId) : null;
  const selectedReports = selectedPerson ? profiles.filter((profile) => profile.manager_id === selectedPerson.id) : [];
  const selectedManager = selectedPerson?.manager_id
    ? profiles.find((profile) => profile.id === selectedPerson.manager_id)
    : null;

  const fitToScreen = useCallback(() => {
    if (!canvasRef.current || positions.size === 0) {
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    positions.forEach((position) => {
      minX = Math.min(minX, position.x - NODE_W / 2);
      maxX = Math.max(maxX, position.x + NODE_W / 2);
      minY = Math.min(minY, position.y - NODE_H / 2);
      maxY = Math.max(maxY, position.y + NODE_H / 2);
    });

    const contentWidth = maxX - minX + 120;
    const contentHeight = maxY - minY + 120;
    const zoom = Math.min(Math.max(Math.min(rect.width / contentWidth, rect.height / contentHeight), 0.35), 1.1);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    setView({
      z: zoom,
      x: rect.width / 2 - centerX * zoom,
      y: rect.height / 2 - centerY * zoom,
    });
  }, [positions]);

  useEffect(() => {
    const timer = window.setTimeout(() => fitToScreen(), 90);
    return () => window.clearTimeout(timer);
  }, [fitToScreen, layout, positions]);

  useEffect(() => {
    const node = canvasRef.current;
    if (!node) {
      return;
    }

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = node.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      setView((current) => {
        const nextZoom = Math.min(Math.max(current.z * (event.deltaY < 0 ? 1.1 : 0.9), 0.35), 1.6);
        const factor = nextZoom / current.z;
        return {
          z: nextZoom,
          x: mouseX - (mouseX - current.x) * factor,
          y: mouseY - (mouseY - current.y) * factor,
        };
      });
    };

    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      if (!panRef.current) {
        return;
      }
      const dx = event.clientX - panRef.current.mouseX;
      const dy = event.clientY - panRef.current.mouseY;
      setView((current) => ({
        ...current,
        x: panRef.current ? panRef.current.viewX + dx : current.x,
        y: panRef.current ? panRef.current.viewY + dy : current.y,
      }));
    };

    const onUp = () => {
      panRef.current = null;
      if (canvasRef.current) {
        canvasRef.current.style.cursor = "grab";
      }
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const startPan = (event: React.MouseEvent) => {
    panRef.current = {
      mouseX: event.clientX,
      mouseY: event.clientY,
      viewX: view.x,
      viewY: view.y,
    };
    if (canvasRef.current) {
      canvasRef.current.style.cursor = "grabbing";
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Organization Chart</h1>
        <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">{profiles.length} employees across the organization</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setLayout("top-down")}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            layout === "top-down"
              ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300"
              : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          }`}
        >
          <ArrowDown className="h-3.5 w-3.5" />
          Top-Down
        </button>
        <button
          onClick={() => setLayout("left-right")}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            layout === "left-right"
              ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300"
              : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          }`}
        >
          <ArrowRight className="h-3.5 w-3.5" />
          Left-Right
        </button>
        <span className="ml-auto text-sm text-slate-400 dark:text-slate-500">Drag to pan, scroll to zoom, click a person for details</span>
      </div>

      <div
        ref={canvasRef}
        onMouseDown={startPan}
        onClick={() => setSelectedId(null)}
        className="relative min-h-[620px] overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950"
        style={{ cursor: "grab" }}
      >
        <div
          className="absolute inset-0 pointer-events-none opacity-60 dark:opacity-20"
          style={{
            backgroundImage: "radial-gradient(circle, rgb(203 213 225) 1px, transparent 1px)",
            backgroundSize: `${24 * view.z}px ${24 * view.z}px`,
            backgroundPosition: `${view.x}px ${view.y}px`,
          }}
        />

        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.z})`,
            transformOrigin: "0 0",
          }}
        >
          <ConnectorLines flatNodes={flatNodes} positions={positions} layout={layout} />

          {flatNodes.map(({ node }) => {
            const position = positions.get(node.id);
            if (!position) {
              return null;
            }

            const reports = profiles.filter((profile) => profile.manager_id === node.id).length;
            const isSelected = selectedId === node.id;
            const roleTone = getRoleTone(node.role);

            return (
              <motion.button
                key={node.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                onMouseDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedId(node.id);
                }}
                className={`absolute rounded-xl border bg-white p-4 text-left shadow-sm transition hover:shadow-md dark:bg-slate-900 ${
                  isSelected ? "border-indigo-400 shadow-md dark:border-indigo-500" : "border-slate-200 dark:border-slate-700"
                }`}
                style={{
                  width: NODE_W,
                  left: position.x - NODE_W / 2,
                  top: position.y - NODE_H / 2,
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white ${getAvatarColor(
                      node.id
                    )}`}
                  >
                    {getInitials(node.first_name, node.last_name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {node.first_name} {node.last_name}
                    </p>
                    <p className="truncate text-xs text-slate-400 dark:text-slate-500">{node.title}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3 dark:border-slate-700">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${roleTone}`}>
                    {humanRole(node.role)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                    {reports > 0 ? <User className="h-3.5 w-3.5" /> : null}
                    {reports > 0 ? reports : ""}
                    <span className={`h-2 w-2 rounded-full ${node.onboarding_completed ? "bg-emerald-600" : "bg-amber-600"}`} />
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>

        <div
          className="absolute bottom-4 right-4 flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-md dark:border-slate-700 dark:bg-slate-900"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <button
            onClick={() => setView((current) => ({ ...current, z: Math.max(current.z * 0.85, 0.35) }))}
            className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="min-w-[42px] text-center font-mono text-xs text-slate-500 dark:text-slate-400">
            {Math.round(view.z * 100)}%
          </span>
          <button
            onClick={() => setView((current) => ({ ...current, z: Math.min(current.z * 1.18, 1.6) }))}
            className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <span className="mx-0.5 h-5 w-px bg-slate-200 dark:bg-slate-700" />
          <button onClick={fitToScreen} className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
            <Maximize className="h-4 w-4" />
          </button>
        </div>

        {selectedPerson && (
          <motion.aside
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(event) => event.stopPropagation()}
            className="absolute bottom-4 right-4 top-4 z-20 w-[300px] overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex justify-end">
              <button
                onClick={() => setSelectedId(null)}
                className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="-mt-2 flex flex-col items-center text-center">
              <span
                className={`flex h-14 w-14 items-center justify-center rounded-full text-lg font-semibold text-white ${getAvatarColor(
                  selectedPerson.id
                )}`}
              >
                {getInitials(selectedPerson.first_name, selectedPerson.last_name)}
              </span>
              <h3 className="mt-3 text-lg font-semibold text-slate-900 dark:text-slate-100">
                {selectedPerson.first_name} {selectedPerson.last_name}
              </h3>
              <p className="text-sm text-slate-400 dark:text-slate-500">{selectedPerson.title}</p>
              <span className={`mt-2 rounded-full px-2.5 py-1 text-xs font-semibold ${getRoleTone(selectedPerson.role)}`}>
                {humanRole(selectedPerson.role)}
              </span>
            </div>

            <div className="mt-5 space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 text-slate-400" />
                <div className="min-w-0">
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">Email</p>
                  <p className="break-all text-sm text-slate-700 dark:text-slate-200">{selectedPerson.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="mt-0.5 h-4 w-4 text-slate-400" />
                <div className="min-w-0">
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">Reports to</p>
                  <p className="text-sm text-slate-700 dark:text-slate-200">
                    {selectedManager ? `${selectedManager.first_name} ${selectedManager.last_name}` : "-"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="mt-0.5 h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">Started</p>
                  <p className="text-sm text-slate-700 dark:text-slate-200">{formatDate(selectedPerson.started_date)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className={`mt-1 h-2 w-2 rounded-full ${selectedPerson.onboarding_completed ? "bg-emerald-600" : "bg-amber-600"}`} />
                <div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">Onboarding</p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {selectedPerson.onboarding_completed ? "Completed" : "In progress"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-700">
              <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-slate-400 dark:text-slate-500">
                Direct Reports {selectedReports.length ? `- ${selectedReports.length}` : ""}
              </p>
              <div className="mt-3 space-y-2">
                {selectedReports.length === 0 && (
                  <p className="text-xs text-slate-400 dark:text-slate-500">No direct reports.</p>
                )}
                {selectedReports.map((report) => (
                  <div key={report.id} className="flex items-center gap-2">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold text-white ${getAvatarColor(
                        report.id
                      )}`}
                    >
                      {getInitials(report.first_name, report.last_name)}
                    </span>
                    <p className="text-sm text-slate-700 dark:text-slate-200">
                      {report.first_name} {report.last_name}
                      <span className="text-slate-400 dark:text-slate-500"> - {report.title}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-700">
              <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-slate-400 dark:text-slate-500">Integrations</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {integrations
                  .filter((item) => item.is_active)
                  .map((integration) => (
                    <span
                      key={integration.id}
                      className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] capitalize text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    >
                      {integration.platform_name}
                    </span>
                  ))}
              </div>
            </div>
          </motion.aside>
        )}
      </div>
    </div>
  );
}
