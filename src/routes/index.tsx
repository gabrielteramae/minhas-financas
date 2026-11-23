import { createFileRoute } from "@tanstack/react-router";
import { SoldoApp } from "@/components/soldo/app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <SoldoApp />;
}