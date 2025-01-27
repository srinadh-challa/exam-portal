declare module "@uiw/react-codemirror" {
  import { EditorView, Extension } from "@codemirror/view";
  import { ReactNode } from "react";
  // global.d.ts
  declare global {
    interface Window {
      loadPyodide: () => Promise<any>;
    }
  }

  export {};

  export interface CodeMirrorProps {
    value?: string;
    height?: string;
    extensions?: Extension[];
    theme?: string | Extension;
    onChange?: (value: string, viewUpdate: any) => void;
    autoFocus?: boolean;
    editable?: boolean;
    placeholder?: string;
    className?: string; // Allow custom className for background color and other styles
    style?: React.CSSProperties; // Alternatively, allow inline styles
  }

  export const Controlled: React.FC<CodeMirrorProps>;

  export default Controlled;
}
