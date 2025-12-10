"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "How can I place an order?",
    answer:
      "Placing an order is easy! Simply start by going into your Account settings, update your contact, address and shipping information. Once done hit save and you can start browse our website, select the products you want, add them to your cart, and proceed to checkout. Follow the on-screen instructions to complete your purchase.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept a variety of payment methods, including credit cards and cash on delivery. Choose the one that suits you best during the checkout process.",
  },
  {
    question: "How long does delivery take?",
    answer:
      "Delivery times may vary depending on your location and the product. We strive to deliver your orders as quickly as possible, and you can check the estimated delivery time during the checkout process.",
  },
  {
    question: "Do you offer refunds or returns?",
    answer:
      "Yes, we have a hassle-free return and refund policy. If you're not satisfied with your purchase, you can initiate a return request, and we'll guide you through the process.",
  },
  {
    question: "Is my personal information safe?",
    answer:
      "Absolutely. We take data security seriously and have robust measures in place to protect your personal information. Your data is safe with us.",
  },
];

export default function FAQs() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="max-w-4xl mx-auto px-6 py-16">
      <h2 className="text-3xl font-bold text-primary text-center mb-10">
        Frequently Asked Questions
      </h2>
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="border border-border rounded-lg bg-secondary text-white shadow-sm"
          >
            <button
              onClick={() =>
                setOpenIndex(openIndex === index ? null : index)
              }
              className="flex justify-between items-center w-full px-6 py-4 text-left"
            >
              <span className="font-semibold">{faq.question}</span>
              <ChevronDown
                className={`h-5 w-5 transform transition-transform duration-300 ${
                  openIndex === index ? "rotate-180 text-primary" : "text-white/70"
                }`}
              />
            </button>

            {openIndex === index && (
              <div className="px-6 pb-4 text-white/80 text-sm leading-relaxed">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
