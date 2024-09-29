import { MDXProvider } from "@mdx-js/react";
import { langs } from "@uiw/codemirror-extensions-langs/src/index";
import CodeMirror from "@uiw/react-codemirror";

type LangKeys = keyof typeof langs;

const CodeEditor = ({ code, lang }: { code: string; lang: LangKeys }) => {
  return (
    <MDXProvider>
      <CodeMirror
        theme={"dark"}
        editable={false}
        extensions={[langs[lang]()]}
        value={code}
      />
    </MDXProvider>
  );
};

export default CodeEditor;
