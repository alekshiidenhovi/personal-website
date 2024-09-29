import { BlogSectionLink } from "@/components/BlogSectionLink";
import type { Heading } from "@/components/types";

interface BlogNavigationProps {
  sectionLinks: Heading[];
  activeSlug: string;
}

export default function BlogNavigation({
  sectionLinks,
  activeSlug,
}: BlogNavigationProps) {
  return (
    <aside className="sticky top-0 h-full">
      <span className="flex pb-6 text-3xl font-semibold text-neutral-200 text-opacity-70">
        Table of Contents
      </span>
      <nav className="flex flex-col gap-2">
        {sectionLinks.map((heading) => {
          return (
            <BlogSectionLink
              key={heading.slug}
              href={heading.slug}
              isActive={heading.slug === activeSlug}
              text={heading.text}
              depth={heading.depth as 2 | 3 | 4 | 5 | 6}
            />
          );
        })}
      </nav>
    </aside>
  );
}
