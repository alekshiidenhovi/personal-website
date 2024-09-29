import { type VariantProps, cva } from "class-variance-authority";
import { type ForwardedRef, forwardRef } from "react";

const styles = cva("w-fit transition-all", {
  variants: {
    isActive: {
      true: "text-primary-500",
      false: "text-neutral-500 hover:text-primary-500 hover:opacity-80",
    },
    depth: {
      2: "pl-0 text-xl font-medium",
      3: "pl-4 text-lg",
      4: "pl-8 text-base",
      5: "pl-12 text-sm",
      6: "pl-16 text-xs",
    },
  },
});

export interface Link extends VariantProps<typeof styles> {
  href: string;
  text: string;
}

type RefProps = ForwardedRef<HTMLAnchorElement>;

export const BlogSectionLink = forwardRef(
  ({ href, isActive, text, depth }: Link, ref: RefProps) => {
    return (
      <a ref={ref} href={href} className={styles({ isActive, depth })}>
        {text}
      </a>
    );
  },
);
