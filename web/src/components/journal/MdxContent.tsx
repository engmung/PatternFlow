import { evaluate } from "@mdx-js/mdx";
import { Fragment, type ComponentType } from "react";
import { jsx, jsxs } from "react/jsx-runtime";

type MdxContentProps = {
  source: string;
};

export default async function MdxContent({ source }: MdxContentProps) {
  const { default: Content } = (await evaluate(source, {
    Fragment,
    jsx,
    jsxs,
    baseUrl: import.meta.url,
  })) as { default: ComponentType };

  return <Content />;
}
