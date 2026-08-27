import React from "react";
import { render, screen } from "@testing-library/react";
import { ShieldCheck } from "lucide-react";
import { describe, expect, it } from "vitest";
import { TrustCard } from "./trust-card";

describe("TrustCard", () => {
  it("exposes its title and explanation as an article", () => {
    render(<TrustCard icon={ShieldCheck} title="Functionally tested" description="Every core function is checked." />);
    expect(screen.getByRole("article")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Functionally tested" })).toBeInTheDocument();
    expect(screen.getByText("Every core function is checked.")).toBeInTheDocument();
  });
});
