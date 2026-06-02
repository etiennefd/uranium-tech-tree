import React, { useState, useEffect, memo } from 'react';
import { cacheManager } from '@/utils/cache';

const IntroBox = memo(() => {
  const [counts, setCounts] = useState({ nodes: 0, links: 0 });
  const darkerBlue = "#C5C95C";
  const linkStyle = { color: darkerBlue, textDecoration: "underline" };
  const numberStyle = {
    color: darkerBlue,
    fontFamily: "var(--font-app-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
  };

  // Get counts from cache and data
  useEffect(() => {
    const getCounts = async () => {
      try {
        // First try to get cached data
        const cachedData = await cacheManager.get();
        if (cachedData?.detailData) {
          setCounts({
            nodes: cachedData.detailData.nodes?.length || 0,
            links: cachedData.detailData.links?.length || 0
          });
        } else if (cachedData?.basicData) {
          setCounts({
            nodes: cachedData.basicData.nodes?.length || 0,
            links: cachedData.basicData.links?.length || 0
          });
        }

        // Then fetch fresh data
        const response = await fetch("/api/inventions");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const freshData = await response.json();
        setCounts({
          nodes: freshData.nodes?.length || 0,
          links: freshData.links?.length || 0
        });
      } catch (error) {
        console.warn("Failed to fetch counts:", error);
        // Don't update counts if there's an error - keep using cached data
      }
    };
    getCounts();
  }, []);

  return (
    <div className="absolute left-4 top-8 p-6 w-[400px] z-50">
      <h1 className="text-3xl font-bold mb-3 tracking-tight" style={{ color: darkerBlue }}>
        URANIUM TECH TREE
      </h1>
      <p className="text-sm mb-3" style={{ color: darkerBlue }}>
        A companion piece to the blog post{" "}
        <a
          href="https://www.hopefulmons.com/p/reality-is-joking-about-u"
          target="_blank"
          rel="noopener noreferrer"
          style={linkStyle}
        >
          Reality Is Joking About U
        </a>{" "}
        by Étienne Fortier-Dubois.
      </p>

      <p className="text-sm" style={{ color: darkerBlue }}>
        Two and a half centuries of science, industry, art, and anxiety
        surrounding a single element — currently{" "}
        <span style={numberStyle}>{counts.nodes}</span> entries linked by{" "}
        <span style={numberStyle}>{counts.links}</span> connections. Hover or
        click any node to learn more.
      </p>
    </div>
  );
});

IntroBox.displayName = "IntroBox";

export default IntroBox; 