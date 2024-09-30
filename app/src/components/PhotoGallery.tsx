import React from "react";

import { MDXProvider } from "@mdx-js/react";

interface Image {
  src: string;
  alt: string;
}

const PhotoGallery = ({
  images,
  caption,
}: {
  images: Image[];
  caption: string;
}) => {
  return (
    <MDXProvider>
      <figure className="flex flex-col items-center gap-1">
        <div className="flex gap-4">
          {images.map((image) => (
            <picture className="group relative h-full w-full scale-90 overflow-hidden rounded-2xl border-2 border-transparent transition-all duration-300 hover:scale-100 hover:border-primary-500">
              <div className="absolute inset-0 bg-black opacity-20 transition-opacity duration-300 group-hover:opacity-0" />
              <img
                className="h-full w-full object-cover"
                src={image.src}
                alt={image.alt}
              />
            </picture>
          ))}
        </div>
        <figcaption className="prose w-full text-center text-lg text-neutral-500">
          {caption}
        </figcaption>
      </figure>
    </MDXProvider>
  );
};

export default PhotoGallery;
