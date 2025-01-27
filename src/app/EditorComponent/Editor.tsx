import React, { useState, useEffect } from "react";
import CodeMirror from "@uiw/react-codemirror"; // Default export
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python"; // Import Python language support
import { oneDark } from "@codemirror/theme-one-dark"; // Import the theme extension

interface CodeEditorProps {
  initialCode?: string;
  onChange?: (value: string) => void;
  language?: "javascript" | "python" | "java"; // Language prop to switch languages
  setLanguage?: (language: "javascript" | "python" | "java") => void; // Function to set language
}

const CodeEditor: React.FC<CodeEditorProps> = ({ initialCode = "", onChange, language = "javascript", setLanguage }) => {
  const [code, setCode] = useState<string>(initialCode);
  const [output, setOutput] = useState<string>("");
  const [pyodide, setPyodide] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load Pyodide dynamically
  useEffect(() => {
    const loadPyodideScript = () => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/pyodide/v0.22.1/full/pyodide.js";
      script.async = true;
      script.onload = () => loadPyodide(); // Load Pyodide when the script is loaded
      script.onerror = () => {
        setOutput("Failed to load Pyodide.");
        setLoading(false);
      };
      document.body.appendChild(script);
    };

    const loadPyodide = async () => {
      try {
        // Try loading Pyodide
        const pyodideInstance = await (window as any).loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.22.1/full/"
        });
        setPyodide(pyodideInstance);
        setLoading(false);  // Set loading state to false once Pyodide is ready
      } catch (error) {
        console.error("Failed to load Pyodide:", error);
        setOutput("Error loading Pyodide.");
        setLoading(false);
      }
    };

    loadPyodideScript(); // Load Pyodide script dynamically

    return () => {
      // Clean up when the component unmounts
      const scriptTags = document.querySelectorAll('script[src="https://cdn.jsdelivr.net/pyodide/v0.22.1/full/pyodide.js"]');
      scriptTags.forEach(script => script.remove());
    };
  }, []);

  const handleChange = (value: string) => {
    setCode(value);
    onChange?.(value); // Call the onChange prop if provided
  };

  const handleRun = async () => {
    try {
      if (language === "javascript") {
        const result = eval(code); // Run JavaScript code (not recommended for production)
        setOutput(String(result));
      } else if (language === "python") {
        if (loading) {
          setOutput("Pyodide is still loading, please wait...");
          return;
        }

        if (pyodide) {
          const result = await pyodide.runPython(code); // Execute Python code using Pyodide
          setOutput(result); // Set the output result
        } else {
          setOutput("Pyodide is not loaded yet.");
        }
      } else if (language === "java") {
        setOutput("Java execution is not available in the browser.");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setOutput(`Error: ${error.message}`);
      } else {
        setOutput("An unknown error occurred.");
      }
    }
  };

  // Set the correct language extension for CodeMirror based on selected language
  const languageExtension =
    language === "python" ? python() : language === "java" ? [] : javascript();

  return (
    <div className="p-4 max-w-4xl mx-auto bg-gray-800">
      <div className="mb-4 flex items-center space-x-4">
        {/* Language Dropdown */}
        <select
          value={language}
          onChange={(e) => setLanguage?.(e.target.value as "javascript" | "python" | "java")}
          className="p-2 border border-gray-500 rounded-md bg-gray-700 text-white"
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
        </select>

        <button
          onClick={handleRun}
          className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Run
        </button>
      </div>

      {/* CodeMirror Wrapper with custom background color */}
      <div className="border-2 border-gray-500 rounded-md shadow-sm bg-gray-900 text-white">
        <CodeMirror
          value={code}
          height="300px"
          extensions={[languageExtension, oneDark]} // Use the correct language extension
          onChange={(value) => handleChange(value)} // Handle value changes in the editor
          className="bg-gray-900" // Apply background color to the editor
          theme={oneDark} // Set the theme to One Dark
        />
      </div>

      <div className="mt-4">
        <h3 className="text-lg font-semibold text-white">Output:</h3>
        <pre className="bg-gray-700 p-4 rounded-md border border-gray-500 text-white">{output}</pre>
      </div>
    </div>
  );
};

const App = () => {
  const [language, setLanguage] = useState<"javascript" | "python" | "java">("javascript");

  return (
    <div>
      <CodeEditor language={language} setLanguage={setLanguage} />
    </div>
  );
};

export default App;
