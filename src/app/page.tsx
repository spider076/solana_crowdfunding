"use client";
import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <main className="container mx-auto px-6 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-5xl font-extrabold md:text-7xl">
            Welcome to the Future of Fundraising
          </h1>
          <p className="mt-4 text-lg text-gray-400 md:text-xl">
            Bringing transparency and efficiency to crowdfunding using Solana.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12"
        >
          <Link
            href="/crowdfunding"
            className="rounded-full bg-indigo-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-transform duration-300 hover:scale-105 hover:bg-indigo-700"
          >
            Get Started
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-16 grid gap-8 md:grid-cols-3"
        >
          <div className="rounded-lg bg-gray-800 p-8 shadow-lg">
            <h3 className="text-2xl font-bold">Decentralized</h3>
            <p className="mt-2 text-gray-400">
              Built on the Solana blockchain for maximum security and
              decentralization.
            </p>
          </div>
          <div className="rounded-lg bg-gray-800 p-8 shadow-lg">
            <h3 className="text-2xl font-bold">Transparent</h3>
            <p className="mt-2 text-gray-400">
              All transactions are public and verifiable on the blockchain.
            </p>
          </div>
          <div className="rounded-lg bg-gray-800 p-8 shadow-lg">
            <h3 className="text-2xl font-bold">Fast & Low-Cost</h3>
            <p className="mt-2 text-gray-400">
              Experience lightning-fast transactions with near-zero fees.
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default LandingPage;