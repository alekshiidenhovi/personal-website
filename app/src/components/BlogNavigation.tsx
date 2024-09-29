import { useState } from "react";
import { useInView } from "react-intersection-observer";

import { BlogSectionLink } from "@/components/BlogSectionLink";
import type { Heading } from "@/components/types";

interface BlogNavigationProps {
  sectionLinks: Heading[];
}

export default function BlogNavigation({ sectionLinks }: BlogNavigationProps) {
  // const [activeSlug, setActiveSlug] = useState<string>(
  //   sectionLinks[0]?.slug || "",
  // );

  // const handleIntersection = (
  //   inView: boolean,
  //   entry: IntersectionObserverEntry,
  // ) => {
  //   const slug = entry.target.getAttribute("href") || "";
  //   console.log(`Slug ${slug} is in view: ${inView}`);
  //   if (inView) {
  //     setActiveSlug(slug);
  //   }
  // };

  // // Apply `useInView` hook to observe each section
  // const pixelOffset = 32;
  // const windowHeight = typeof window !== "undefined" ? window.innerHeight : 0;
  // const triggerHeight = 16;
  // const topOffset = `${pixelOffset}px`;
  // const bottomOffset = `${windowHeight - pixelOffset + triggerHeight}px`;
  // const { ref } = useInView({
  //   rootMargin: `${topOffset} 0px ${bottomOffset} 0px`, // Trigger the callback when 50% of the section is visible
  //   threshold: 0,
  //   onChange: handleIntersection, // Trigger the intersection callback
  // });

  // const navigationId = "blog-navigation";
  // const introHeading = document.getElementById("introduction");
  // const wrapper = document.getElementById("page-wrapper");
  // const wrapperRect = wrapper?.getBoundingClientRect();
  // const initialTopOffset = headingRect.top - wrapperRect.top;
  // const topOffset = `${initialTopOffset / 16}rem`;
  const topOffset = "4rem";

  return (
    <aside
      // id={navigationId}
      className={`sticky top-16 mt-[18.8rem] h-fit max-w-64`}
    >
      <span className="flex pb-6 text-3xl font-semibold text-neutral-200 text-opacity-70">
        Table of Contents
      </span>
      <nav className="flex flex-col gap-2">
        {sectionLinks.map((heading) => (
          <BlogSectionLink
            key={heading.slug}
            href={heading.slug}
            isActive={false}
            text={heading.text}
            depth={heading.depth as 2 | 3 | 4 | 5 | 6}
          />
        ))}
      </nav>
    </aside>
  );
}
