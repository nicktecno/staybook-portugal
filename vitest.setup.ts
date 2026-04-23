import "@testing-library/jest-dom/vitest";
import * as React from "react";
import { vi } from "vitest";

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown> & { src?: string; alt?: string }) =>
    React.createElement("img", {
      src: props.src,
      alt: props.alt ?? "",
      className: props.className as string | undefined,
    }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children?: React.ReactNode;
    className?: string;
  }) => React.createElement("a", { href, ...rest }, children),
}));
