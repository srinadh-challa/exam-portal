// // components/PythonExecutor.tsx
// import React, { useState, useEffect } from 'react';
// import CodeMirror from '@uiw/react-codemirror';  // Default export
// import { python } from '@codemirror/lang-python';  // Python syntax highlighting
// import '@codemirror/theme-one-dark/style.css';  // Optional theme
// import '@codemirror/view/style.css';  // Codemirror styles

// const PythonExecutor: React.FC = () => {
//   const [code, setCode] = useState<string>(''); // Python code from editor
//   const [output, setOutput] = useState<string>(''); // Output of Python execution
//   const [pyodide, setPyodide] = useState<any>(null); // Store Pyodide instance
//   const [loading, setLoading] = useState<boolean>(true); // Loading state

//   // Load Pyodide
//   useEffect(() => {
//     const loadPyodide = async () => {
//       try {
//         console.log('Loading Pyodide...');
//         const pyodideInstance = await (window as any).loadPyodide({
//           indexURL: "https://cdn.jsdelivr.net/pyodide/v0.22.1/full/"
//         });
//         setPyodide(pyodideInstance); // Set the loaded Pyodide instance
//         setLoading(false); // Set loading state to false after loading is complete
//         console.log('Pyodide Loaded:', pyodideInstance);
//       } catch (error) {
//         console.error('Failed to load Pyodide:', error);
//         setOutput('Failed to load Pyodide');
//         setLoading(false);
//       }
//     };

//     loadPyodide(); // Load Pyodide on mount
//   }, []);

//   // Handle "Run" button click
//   const handleRun = async () => {
//     console.log("Run button clicked"); // Check if this line is triggered

//     if (loading) {
//       setOutput('Pyodide is loading, please wait...');
//       return;
//     }

//     if (pyodide) {
//       try {
//         console.log("Running Python code..."); // Check if Pyodide is available
//         const result = await pyodide.runPython(code); // Execute Python code using Pyodide
//         setOutput(result); // Set the output result
//       } catch (error: any) {
//         setOutput(`Error: ${error.message}`); // Display error message if execution fails
//       }
//     } else {
//       setOutput('Pyodide is not loaded yet.');
//     }
//   };

//   return (
//     <div className="max-w-4xl mx-auto my-10 p-4">
//       <h1 className="text-2xl font-semibold mb-4">Python Code Executor</h1>

//       {/* CodeMirror editor */}
//       <CodeMirror
//         value={code}
//         height="300px"
//         extensions={[python()]} // Use Python extension for CodeMirror
//         onChange={(value) => setCode(value)} // Update code state when editor changes
//         className="mb-4"
//       />

//       {/* Run button */}
//       <button
//         onClick={handleRun}
//         className="bg-blue-500 text-white py-2 px-4 rounded mb-4"
//         disabled={loading} // Disable button while Pyodide is loading
//       >
//         {loading ? 'Loading Pyodide...' : 'Run Python Code'}
//       </button>

//       {/* Output */}
//       <div>
//         <h2 className="text-xl font-semibold">Output:</h2>
//         <pre className="bg-gray-800 text-white p-4 rounded">{output}</pre>
//       </div>
//     </div>
//   );
// };

// export default PythonExecutor;
