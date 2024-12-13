"use client";
import Image from "next/image";
import Files from "./components/files";
import { useState } from "react";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start border p-10 rounded-lg bg-white">
        <h1 className="text-4xl font-bold h-1">PDF Carousel</h1>
        <p className="text-xl font-light mt-0 pt-0">
          &mdash; Create a carousel of images inside a PDF
        </p>
        <ol className="list-inside list-decimal text-sm text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
          <li className="mb-2">Pick your images </li>
          <li>Hit the &quot;Create PDF&quot; button</li>
        </ol>
        <Files />
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://planethurley.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Produced by PlanetHurley
        </a>
      </footer>
    </div>
  );
}
