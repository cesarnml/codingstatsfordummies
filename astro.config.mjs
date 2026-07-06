// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { visit } from 'unist-util-visit';

/** Remark plugin: convert ```mermaid blocks to <div class="mermaid"> for CDN rendering */
function remarkMermaid() {
  return (tree) => {
    visit(tree, 'code', (node, index, parent) => {
      if (node.lang === 'mermaid') {
        parent.children.splice(index, 1, {
          type: 'html',
          value: `<div class="mermaid">\n${node.value}\n</div>`,
        });
      }
    });
  };
}

export default defineConfig({
  site: 'https://codingstatsfordummies.vercel.app',
  markdown: {
    remarkPlugins: [remarkMermaid],
  },
  integrations: [
    starlight({
      customCss: ['./src/styles/custom.css'],
      title: 'CodingStats for Dummies',
      description:
        'A field guide to building the CodingStats iOS companion app — an Apple Health for coding fitness. Swift & SwiftUI primer for TypeScript devs, WakaTime data retention, coding-time goals, burnout signals, and client invoicing.',
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/cesarnml/waka-shortcut-time-stats',
        },
      ],
      head: [
        { tag: 'link', attrs: { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' } },
        {
          tag: 'meta',
          attrs: {
            name: 'keywords',
            content:
              'CodingStats, WakaTime, coding fitness, Apple Health for coding, Swift for TypeScript devs, SwiftUI primer, iOS companion app, coding time tracking, burnout prevention, developer invoicing, Supabase, SvelteKit',
          },
        },
        { tag: 'script', attrs: { defer: true, src: '/_vercel/insights/script.js' } },
        {
          tag: 'script',
          attrs: { type: 'module' },
          content: `
            import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
            mermaid.initialize({ startOnLoad: true, theme: 'dark' });
          `,
        },
      ],
      sidebar: [
        { label: 'Home', slug: '' },
        {
          label: 'Start here',
          items: [{ label: '01 — The Big Picture', slug: '01-the-big-picture' }],
        },
        {
          label: 'Apple primer',
          items: [
            { label: '02 — Swift for TypeScript Devs', slug: '02-swift-for-typescript-devs' },
            { label: '03 — SwiftUI, Xcode & iOS Primitives', slug: '03-swiftui-xcode-primitives' },
          ],
        },
        {
          label: 'The data spine',
          items: [
            { label: '04 — The Data Contract', slug: '04-the-data-contract' },
            { label: '05 — Architecture of the iOS Companion', slug: '05-ios-companion-architecture' },
          ],
        },
        {
          label: 'Coding fitness',
          items: [
            { label: '06 — Windows, Goals & Rings', slug: '06-windows-goals-rings' },
            { label: '07 — Sustainability & Burnout Signals', slug: '07-burnout-signals' },
            { label: '08 — AI Usage as a Fitness Signal', slug: '08-ai-usage-signal' },
            { label: '09 — Client Mode & Invoicing', slug: '09-client-mode-invoicing' },
          ],
        },
        {
          label: 'Shipping',
          items: [
            { label: '10 — App Store: Signing, TestFlight & Review', slug: '10-app-store' },
          ],
        },
        {
          label: 'Hands-on',
          items: [
            { label: '11 — Challenges', slug: '11-challenges' },
            { label: '12 — Learning Resources', slug: '12-learning-resources' },
          ],
        },
      ],
    }),
  ],
});
