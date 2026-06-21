"use client";

import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { useAppStore } from "@/lib/store";
import { useHydration } from "@/hooks/useHydration";
import Link from "next/link";
import { ArrowRight, BookOpen, Database, FileText, Sparkles } from "lucide-react";

const cards = [
  {
    href: "/sources",
    icon: BookOpen,
    title: "원본 지문 등록",
    desc: "영어 지문과 해설을 직접 입력하거나 엑셀로 일괄 등록",
    color: "bg-blue-50 text-blue-600",
  },
  {
    href: "/generate",
    icon: Sparkles,
    title: "유사 문제 생성",
    desc: "수능 유형별 옵션을 선택하고 AI 기반 유사 문항 생성",
    color: "bg-violet-50 text-violet-600",
  },
  {
    href: "/database",
    icon: Database,
    title: "문항 DB",
    desc: "저장된 문항을 검색·관리하고 시험지에 활용",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    href: "/exam",
    icon: FileText,
    title: "시험지 만들기",
    desc: "문항을 선택해 시험지를 구성하고 PDF로 내보내기",
    color: "bg-amber-50 text-amber-600",
  },
];

export default function DashboardPage() {
  const hydrated = useHydration();
  const sources = useAppStore((s) => s.sources);
  const questions = useAppStore((s) => s.questions);
  const exams = useAppStore((s) => s.exams);

  const stats = [
    { label: "등록된 원본", value: hydrated ? sources.length : "—" },
    { label: "저장된 문항", value: hydrated ? questions.length : "—" },
    { label: "생성된 시험지", value: hydrated ? exams.length : "—" },
  ];

  return (
    <AppShell>
      <PageHeader
        title="대시보드"
        description="영어 수능 유형 유사 시험 문제 플랫폼"
      />

      <div className="mb-8 grid grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-card-border bg-card px-5 py-4"
          >
            <p className="text-xs font-medium text-muted">{stat.label}</p>
            <p className="mt-1 text-3xl font-bold tracking-tight">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {cards.map(({ href, icon: Icon, title, desc, color }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-start gap-4 rounded-xl border border-card-border bg-card p-5 transition-all hover:border-accent/30 hover:shadow-md"
          >
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}
            >
              <Icon size={22} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{title}</h3>
                <ArrowRight
                  size={16}
                  className="text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent"
                />
              </div>
              <p className="mt-1 text-sm text-muted">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
