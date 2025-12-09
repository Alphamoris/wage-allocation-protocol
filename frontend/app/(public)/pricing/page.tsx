"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Sparkles, Zap, ShieldCheck, Clock, Users, ArrowUpRight } from "lucide-react";

const plans = [
  {
    name: "Starter",
    tagline: "Launch wage streaming in minutes",
    priceMonthly: 0,
    priceAnnual: 0,
    cta: "Start Free",
    href: "/onboarding",
    popular: false,
    highlights: [
      "Up to 50 employees",
      "Instant claims",
      "Email support",
      "Compliance defaults"
    ],
  },
  {
    name: "Growth",
    tagline: "Scale with real-time payroll",
    priceMonthly: 399,
    priceAnnual: 319,
    cta: "Scale with Growth",
    href: "/onboarding",
    popular: true,
    highlights: [
      "Up to 500 employees",
      "Treasury automation",
      "Priority support",
      "Advanced analytics",
      "SOC2-ready tooling"
    ],
  },
  {
    name: "Enterprise",
    tagline: "Global, compliant, unstoppable",
    priceMonthly: 0,
    priceAnnual: 0,
    cta: "Talk to us",
    href: "mailto:alphamoris45@gmail.com",
    popular: false,
    highlights: [
      "Unlimited employees",
      "Dedicated success team",
      "Custom SLAs",
      "On-prem & VPC options",
      "White-glove onboarding"
    ],
  },
];

const faqs = [
  {
    q: "How do billing cycles work?",
    a: "Choose monthly or annual. Annual gives you two months free. You can change cycles anytime before your next billing date.",
  },
  {
    q: "Is there a setup fee?",
    a: "No. Starter and Growth are self-serve with zero setup fees. Enterprise includes white-glove onboarding bundled in the agreement.",
  },
  {
    q: "How do employee claims work?",
    a: "Employees can claim their streamed wages instantly. Treasury settlement happens on Aptos with zero-fee claiming for employees.",
  },
  {
    q: "Can I export data for finance & audit?",
    a: "Yes. Growth and Enterprise include automated exports, API access, and ledger-friendly breakdowns for finance and compliance teams.",
  },
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  const reveal = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
  };

  return (
    <div className="relative min-h-screen bg-wap-cream overflow-hidden">
      <div className="absolute inset-0 bg-mesh opacity-60" />
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <motion.div
          className="absolute w-80 h-80 sm:w-[420px] sm:h-[420px] bg-wap-coral/20 blur-[120px] rounded-full -top-24 -left-10"
          animate={{ scale: [1, 1.08, 1], opacity: [0.25, 0.35, 0.25] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute w-72 h-72 sm:w-[360px] sm:h-[360px] bg-wap-gold/18 blur-[120px] rounded-full top-1/3 right-0"
          animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.32, 0.2] }}
          transition={{ duration: 9, repeat: Infinity }}
        />
        <motion.div
          className="absolute w-64 h-64 sm:w-[320px] sm:h-[320px] bg-wap-sky/18 blur-[110px] rounded-full bottom-0 left-1/4"
          animate={{ scale: [1, 1.05, 1], opacity: [0.18, 0.28, 0.18] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      <main className="relative z-10">
        {/* Hero */}
        <section className="pt-20 pb-14 sm:pt-24 sm:pb-16 lg:pt-28 lg:pb-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.6 }}
              variants={reveal}
              className="text-center max-w-4xl mx-auto space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-wap-border/70 shadow-sm backdrop-blur">
                <Sparkles className="w-4 h-4 text-wap-gold" />
                <span className="text-sm font-medium text-wap-text-primary">Transparent, usage-based pricing</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-wap-text-primary">
                Choose clarity. Stream wages without friction.
              </h1>
              <p className="text-base sm:text-lg text-wap-text-secondary max-w-2xl mx-auto">
                Simple plans for teams of every size. Real-time payroll on Aptos with enterprise-grade compliance, automation, and zero-fee claiming for employees.
              </p>

              <div className="flex items-center justify-center gap-3 sm:gap-4">
                <Button
                  variant={billingCycle === "monthly" ? "default" : "outline"}
                  className="rounded-full px-5"
                  onClick={() => setBillingCycle("monthly")}
                >
                  Monthly
                </Button>
                <div className="text-sm text-wap-text-tertiary">or</div>
                <Button
                  variant={billingCycle === "annual" ? "default" : "outline"}
                  className="rounded-full px-5"
                  onClick={() => setBillingCycle("annual")}
                >
                  Annual (save 20%)
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Plans */}
        <section className="pb-16 sm:pb-20 lg:pb-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
              {plans.map((plan, idx) => {
                const price = billingCycle === "monthly" ? plan.priceMonthly : plan.priceAnnual;
                const isEnterprise = plan.name === "Enterprise";
                return (
                  <motion.div
                    key={plan.name}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.08, duration: 0.5 }}
                    className="h-full"
                  >
                    <div
                      className={`relative h-full rounded-2xl sm:rounded-3xl border border-wap-border/80 bg-white shadow-lg shadow-wap-shadow/20 overflow-hidden ${
                        plan.popular ? "ring-2 ring-wap-coral/60" : ""
                      }`}
                    >
                      {plan.popular && (
                        <div className="absolute top-4 right-4 rounded-full bg-wap-coral/10 text-wap-coral text-xs font-semibold px-3 py-1">
                          Most popular
                        </div>
                      )}
                      <div className="p-6 sm:p-8 space-y-4 sm:space-y-5">
                        <div className="space-y-2">
                          <h3 className="text-xl sm:text-2xl font-bold text-wap-text-primary">{plan.name}</h3>
                          <p className="text-sm sm:text-base text-wap-text-secondary">{plan.tagline}</p>
                        </div>

                        <div className="flex items-baseline gap-2">
                          {isEnterprise ? (
                            <span className="text-3xl sm:text-4xl font-semibold text-gradient-gold">Custom</span>
                          ) : (
                            <>
                              <span className="text-3xl sm:text-4xl font-semibold text-gradient-gold">${price}</span>
                              <span className="text-sm text-wap-text-tertiary">/ {billingCycle === "monthly" ? "month" : "mo (annual)"}</span>
                            </>
                          )}
                        </div>

                        <Button
                          asChild
                          size="lg"
                          className={`w-full ${plan.popular ? "btn-liquid" : ""}`}
                          variant={plan.popular ? "default" : "outline"}
                        >
                          <Link href={plan.href} target={plan.href.startsWith("http") || plan.href.startsWith("mailto") ? "_blank" : undefined}>
                            <span className="flex items-center justify-center gap-2">
                              {plan.cta}
                              <ArrowRight className="w-4 h-4" />
                            </span>
                          </Link>
                        </Button>

                        <div className="space-y-3 pt-2">
                          {plan.highlights.map((item) => (
                            <div key={item} className="flex items-start gap-3 text-sm text-wap-text-secondary">
                              <CheckCircle className="w-4 h-4 text-wap-green mt-0.5" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Value props */}
        <section className="pb-16 sm:pb-20 lg:pb-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
              {[
                { title: "Compliance-first", icon: ShieldCheck, desc: "Built-in controls, audit-friendly exports, and enterprise SLAs for finance and legal." },
                { title: "Instant claims", icon: Zap, desc: "Employees claim anytime with zero fees. Treasury automates settlement on Aptos." },
                { title: "Time saved", icon: Clock, desc: "Cut payroll ops by hours each month with real-time streaming and automated payouts." },
              ].map((item, idx) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-6 sm:p-7 rounded-2xl border border-wap-border/70 bg-white/90 shadow-sm backdrop-blur"
                >
                  <div className="w-10 h-10 rounded-xl bg-wap-hover flex items-center justify-center mb-3">
                    <item.icon className="w-5 h-5 text-wap-coral" />
                  </div>
                  <h4 className="text-lg sm:text-xl font-semibold text-wap-text-primary mb-2">{item.title}</h4>
                  <p className="text-sm sm:text-base text-wap-text-secondary">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature comparison */}
        <section className="pb-16 sm:pb-20 lg:pb-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-wap-border/80 bg-white/90 shadow-lg overflow-hidden">
              <div className="grid grid-cols-4 items-center bg-wap-hover/60 px-4 sm:px-6 py-4">
                <div className="text-sm font-semibold text-wap-text-primary">Features</div>
                <div className="text-center text-sm font-semibold text-wap-text-primary">Starter</div>
                <div className="text-center text-sm font-semibold text-wap-text-primary">Growth</div>
                <div className="text-center text-sm font-semibold text-wap-text-primary">Enterprise</div>
              </div>
              {[
                "Real-time wage streaming",
                "Instant employee claims",
                "Treasury automation",
                "Custom analytics",
                "Dedicated support",
                "SLA & compliance",
              ].map((feature, idx) => (
                <div
                  key={feature}
                  className={`grid grid-cols-4 items-center px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base ${idx % 2 === 0 ? "bg-white" : "bg-wap-hover/30"}`}
                >
                  <div className="text-wap-text-primary">{feature}</div>
                  {[true, idx < 5, idx < 6].map((available, colIdx) => (
                    <div key={colIdx} className="flex justify-center">
                      {available ? (
                        <CheckCircle className="w-4 h-4 text-wap-green" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-wap-border" />
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Social proof */}
        <section className="pb-16 sm:pb-20 lg:pb-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-wap-border/70 bg-gradient-to-br from-white via-wap-hover to-white shadow-xl p-6 sm:p-10 flex flex-col gap-6 sm:gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-wap-coral/10 border border-wap-coral/20 text-wap-coral text-sm font-semibold">
                  Trusted by teams who pay in real time
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-wap-text-primary">
                  "WAP cut our payroll overhead by 40% and gave employees instant access."
                </h3>
                <p className="text-sm sm:text-base text-wap-text-secondary">
                  Treasury Ops Lead, Series B fintech (Growth plan)
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {["99.9% Uptime", "0 Fees", "<1m Claims", "SOC2", "24/7", "Global"].map((item) => (
                  <div key={item} className="px-3 py-2 rounded-xl bg-white border border-wap-border/60 text-center text-sm font-semibold text-wap-text-primary shadow-sm">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="pb-16 sm:pb-20 lg:pb-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
              <div className="text-center space-y-2">
                <h3 className="text-2xl sm:text-3xl font-bold text-wap-text-primary">Pricing questions, answered</h3>
                <p className="text-sm sm:text-base text-wap-text-secondary">Everything you need to get started confidently.</p>
              </div>
              <div className="space-y-3 sm:space-y-4">
                {faqs.map((item, idx) => (
                  <motion.div
                    key={item.q}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.05 }}
                    className="rounded-2xl border border-wap-border/70 bg-white/90 p-4 sm:p-5 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-wap-hover flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4 text-wap-coral" />
                      </div>
                      <div className="space-y-1">
                        <div className="font-semibold text-wap-text-primary">{item.q}</div>
                        <p className="text-sm sm:text-base text-wap-text-secondary leading-relaxed">{item.a}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="pb-20 sm:pb-24 lg:pb-28">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative overflow-hidden rounded-3xl border border-wap-border/70 bg-wap-dark text-white px-6 sm:px-10 py-10 sm:py-14"
            >
              <motion.div
                className="absolute -inset-1 bg-gradient-to-r from-wap-coral/20 via-wap-gold/15 to-wap-sky/20 blur-3xl"
                animate={{ opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 8, repeat: Infinity }}
                aria-hidden
              />
              <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="space-y-3 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm font-semibold">
                    Ready to stream wages in real time?
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold leading-tight">
                    Pick a plan today. Your team streams by tomorrow.
                  </h3>
                  <p className="text-sm sm:text-base text-white/80">
                    Launch with Starter in minutes, or talk to us for Growth and Enterprise. Zero setup fees. Employees claim instantly with no fees.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button size="lg" className="btn-liquid text-base" asChild>
                    <Link href="/onboarding" className="flex items-center gap-2">
                      Start Free
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="text-base" asChild>
                    <Link href="mailto:alphamoris45@gmail.com" className="flex items-center gap-2">
                      Talk to Sales
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}
