"use client";

import React, { useState, useEffect, useRef } from "react";

import { useRouter } from 'next/navigation';
import {
  Timer,
  Home,
  BookOpen,
  Brain,
  Code,
  Mail,
  RedoDot,
  ArrowLeft,
  ArrowRight,
  Camera,
  VideoOff,
  GripHorizontal,
} from "lucide-react";

import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";
import Draggable from "../draggable";
import { ToastContainer } from "react-toastify";
import { showErrorToast } from "../ToastProvider";
import ProtectedRoute from "../components/ProtectedRoute";
import LogoutButton from "../components/LogoutButton";

declare global {
  interface Window {
    loadPyodide: (config: { indexURL: string }) => Promise<PyodideInterface>;
  }
}

// Define the Pyodide interface properly
interface PyodideInterface {
  runPython: (code: string) => string;
  runPythonAsync: (code: string) => Promise<string>;
  loadPackage: (packageName: string) => Promise<void>;
  // Add more Pyodide methods if needed
}

type Language = "javascript" | "python";
type AnswersType = {
  [key: string]: string;
};
// import CodeEditor from "../EditorComponent/Editor";

interface Question {
  id: number;
  text: string;
  options: string[];
}

interface Section {
  title: string;
  questions: Question[];
}

interface ExamSections {
  [key: string]: Section; // Allow dynamic keys like "mcqs", "aptitude", etc.
}

const ExamPortal = () => {
  const [timeLeft, setTimeLeft] = useState<number>(60 * 60);
  const [examStarted, setExamStarted] = useState<boolean>(false);
  const [currentSection, setCurrentSection] = useState<string>("home");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [cameraEnabled, setCameraEnabled] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswersType>({});
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isContainerVisible, setIsContainerVisible] = useState(false);
  const [isSection4Visible, setIsSection4Visible] = useState(true);
  const [examSectionsNew, setExamSections] = useState<ExamSections>({});
  

  // const [selectedTitle, setSelectedTitle] = useState("Multiple Choice Questions"); // Default selected title
  const [useCustomInput, setUseCustomInput] = useState(false);
  const [customInput, setCustomInput] = useState("");

  // codeEditor
  // const CodeEditor: React.FC<CodeEditorProps> = ({ initialCode = "", onChange, language = "javascript", setLanguage })
  const [language, setLanguage] = useState<Language>("javascript");
  const [code, setCode] = useState<string>("");
  const [output, setOutput] = useState<string>("");
  const [pyodide, setPyodide] = useState<PyodideInterface | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [inputValue, setInputValue] = useState<string>("");
  const SECTION_ORDER = ["mcqs", "aptitude", "ai", "coding"];
  const router = useRouter();

  
  useEffect(() => {
    if (language === "python") {
      const loadPyodideScript = () => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/pyodide/v0.22.1/full/pyodide.js";
        script.async = true;
        script.onload = () => loadPyodide();
        script.onerror = () => {
          setOutput("Failed to load Pyodide.");
          setLoading(false);
        };
        document.body.appendChild(script);
      };

      const loadPyodide = async () => {
        try {
          const pyodideInstance = await window.loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.22.1/full/",
          });
          setPyodide(pyodideInstance);
          setLoading(false);
        } catch (error) {
          console.error("Failed to load Pyodide:", error);
          setOutput("Error loading Pyodide.");
          setLoading(false);
        }
      };
      loadPyodideScript();
    }
  }, [language]);

  const handleChange = (value: string) => {
    setCode(value);
    // onChange?.(value);
  };

  // Add this useEffect hook with the existing hooks
  useEffect(() => {
    // Reset code when changing coding questions
    if (currentSection === "coding") {
      setCode("");
      setOutput("");
    }
  }, [currentQuestionIndex, currentSection]);

  // Also reset code when switching to coding section
  useEffect(() => {
    if (currentSection === "coding") {
      setCode("");
      setOutput("");
    }
  }, [currentSection]);

  // Modify useEffect for loading test cases
  useEffect(() => {
    if (currentSection === "coding" && !useCustomInput) {
      const currentQuestion =
        examSectionsNew[currentSection].questions[currentQuestionIndex];
      if (currentQuestion?.options) {
        // Extract sample inputs (even indices)
        const sampleInputs = currentQuestion.options.filter(
          (_, idx) => idx % 2 === 0
        );
        setInputValue(sampleInputs.join("\n"));
      }
    }
  }, [currentSection, currentQuestionIndex, examSectionsNew, useCustomInput]);

  // Modified handleRun function
  const handleRun = async () => {
    try {
      const currentQuestion =
        examSectionsNew[currentSection].questions[currentQuestionIndex];

      // Get the correct input source
      const inputToUse = useCustomInput ? customInput : inputValue;
      const testCases = useCustomInput
        ? customInput.split("\n").filter((tc) => tc.trim())
        : inputValue.split("\n").filter((tc) => tc.trim());

      if (language === "javascript") {
        const results = testCases.map((testCase, idx) => {
          try {
            const wrappedCode = `
${code}
try {
  const result = solution(${testCase});
  return JSON.stringify({ result, status: 'success' });
} catch (error) {
  return JSON.stringify({ error: error.message, status: 'error' });
}
          `;
            const response = JSON.parse(eval(wrappedCode));

            if (useCustomInput) {
              return `${testCase} => ${response.result}`;
            }

            // Compare with expected output
            const expectedOutput = currentQuestion.options[idx * 2 + 1];
            const match = response.result === expectedOutput;
            return `${testCase} => ${response.result} ${
              match ? "✓" : `✗ (Expected: ${expectedOutput})`
            }`;
          } catch (error) {
            return `${testCase} => Error: ${
              error instanceof Error ? error.message : "Unknown error"
            }`;
          }
        });
        setOutput(results.join("\n"));
      } else if (language === "python") {
        if (loading || !pyodide) {
          setOutput("Pyodide is still loading...");
          return;
        }

        try {
          await pyodide.runPythonAsync(`
            import sys
            from io import StringIO
            sys.stdout = StringIO()
            sys.stderr = sys.stdout
          `);

          // Use the correct input source
          await pyodide.runPythonAsync(`
            sys.stdin = StringIO("${inputToUse.replace(/\n/g, "\\n")}")
          `);

          // Rest of Python execution logic
          await pyodide.runPythonAsync(code);
          const result = await pyodide.runPythonAsync("sys.stdout.getvalue()");
          setOutput(result);
        } catch (error) {
          setOutput(`Python Error: ${error}`);
        }
      }
    } catch (error) {
      setOutput(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };

  const languageExtension =
    language === "python"
      ? python()
      : language === "javascript"
      ? javascript()
      : [];

  const userEmail = "sriram.lnrs@gmail.com";

  // const togglePreviewSize = () => {
  //   setIsPreviewExpanded(!isPreviewExpanded);
  // };

  // Initialize camera when exam starts

  useEffect(() => {
    if (examStarted && !cameraEnabled) {
      initializeCamera();
    }
    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      if (videoRef.current?.srcObject instanceof MediaStream) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [examStarted]);

  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraEnabled(true);
      startRecording(stream);
    } catch (error) {
      console.error("Error accessing camera:", error);
      setCameraError(
        "Unable to access camera. Please ensure camera permissions are granted."
      );
    }
  };

  const startRecording = (stream: MediaStream) => {
    try {
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          // Here you would typically send the recorded chunk to your server
          // console.log("Recording data available", event.data);
        }
      };

      mediaRecorder.start(1000); // Capture in 1-second chunks
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      setCameraError(
        "Unable to start recording. Please refresh and try again."
      );
    }
  };
  useEffect(() => {
    if (cameraError) {
      console.log("Triggering toast with message:", cameraError); // Debugging line
      showErrorToast(cameraError);
    }
  }, [cameraError]); // ✅ Correct way
  // type ExamSection = {
  //   title: string;
  //   questions: {
  //     id: number;
  //     text: string;
  //     options: string[];
  //   }[];
  // };

  // Sample questions data structure
  // const examSections: Record<string, ExamSection> = {
  //   mcqs: {
  //     title: "Multiple Choice Questions",
  //     questions: [
  //       { id: 1, text: "What is the capital of France?", options: ["London", "Berlin", "Paris", "Madrid"] },
  //       { id: 2, text: "Which programming language is known as the 'mother of all programming languages'?", options: ["C", "Assembly", "FORTRAN", "ALGOL"] },
  //       { id: 3, text: "Who is considered the father of computer science?", options: ["Alan Turing", "Charles Babbage", "John von Neumann", "Ada Lovelace"] },
  //       { id: 4, text: "What does CPU stand for?", options: ["Central Processing Unit", "Computer Processing Unit", "Central Program Utility", "Computer Program Unit"] },
  //       { id: 5, text: "Which company developed the Java programming language?", options: ["Microsoft", "Sun Microsystems", "IBM", "Oracle"] },
  //       { id: 6, text: "What is the primary function of RAM?", options: ["Permanent Storage", "Temporary Storage", "Processing Data", "Data Transfer"] },
  //       { id: 7, text: "What does HTML stand for?", options: ["Hyper Text Markup Language", "High Text Making Language", "Hyper Transfer Markup Language", "High Transfer Making Language"] },
  //       { id: 8, text: "Which protocol is used for sending emails?", options: ["HTTP", "FTP", "SMTP", "TCP"] },
  //       { id: 9, text: "What is the smallest unit of digital information?", options: ["Byte", "Bit", "Nibble", "Word"] },
  //       { id: 10, text: "Which company created React.js?", options: ["Google", "Facebook", "Amazon", "Microsoft"] },
  //     ]
  //   },
  //   aptitude: {
  //     title: "Aptitude Test",
  //     questions: [
  //       { id: 1, text: "If a train travels 420 kilometers in 7 hours, what is its speed in kilometers per hour?", options: ["50 km/h", "60 km/h", "65 km/h", "70 km/h"] },
  //       { id: 2, text: "A computer program runs in 0.08 seconds. How many times can it run in 2 minutes?", options: ["1200", "1500", "1800", "2000"] },
  //       { id: 3, text: "If 3 developers can build an app in 12 days, how many days will it take 4 developers?", options: ["9 days", "8 days", "10 days", "11 days"] },
  //       { id: 4, text: "What comes next in the sequence: 2, 6, 12, 20, ?", options: ["28", "30", "32", "34"] },
  //       { id: 5, text: "A server processes 4000 requests per minute. How many requests can it process in 2.5 hours?", options: ["600,000", "480,000", "520,000", "550,000"] },
  //       { id: 6, text: "Find the missing number: 8, 27, 64, ?, 216", options: ["125", "128", "132", "144"] },
  //       { id: 7, text: "If a code review takes 45 minutes, how many can be completed in a 6-hour workday?", options: ["8", "7", "6", "9"] },
  //       { id: 8, text: "What percentage of 250GB is 40GB?", options: ["16%", "20%", "15%", "18%"] },
  //       { id: 9, text: "Solve: (2^6 × 2^4) ÷ 2^7", options: ["8", "16", "32", "64"] },
  //       { id: 10, text: "If a function takes 100ms to execute, how many times can it run in 3 seconds?", options: ["30", "20", "25", "35"] }
  //     ]
  //   },
  //   ai: {
  //     title: "Artificial Intelligence",
  //     questions: [
  //       { id: 1, text: "Which of these is NOT a type of machine learning?", options: ["Supervised Learning", "Unsupervised Learning", "Peripheral Learning", "Reinforcement Learning"] },
  //       { id: 2, text: "What is the purpose of the activation function in neural networks?", options: ["Data Storage", "Introduce Non-linearity", "Data Cleaning", "Memory Management"] },
  //       { id: 3, text: "Which algorithm is commonly used for image classification?", options: ["Linear Regression", "CNN", "Decision Trees", "Bubble Sort"] },
  //       { id: 4, text: "What does NLP stand for in AI?", options: ["Natural Language Processing", "Neural Linear Programming", "Natural Learning Process", "Network Language Protocol"] },
  //       { id: 5, text: "Which loss function is typically used for binary classification?", options: ["Mean Squared Error", "Binary Cross-Entropy", "Categorical Cross-Entropy", "Hinge Loss"] },
  //       { id: 6, text: "What is the purpose of dropout in neural networks?", options: ["Speed up training", "Prevent overfitting", "Increase accuracy", "Data preprocessing"] },
  //       { id: 7, text: "Which of these is a popular deep learning framework?", options: ["Jenkins", "Docker", "TensorFlow", "Kubernetes"] },
  //       { id: 8, text: "What is the main purpose of feature scaling in machine learning?", options: ["Reduce memory usage", "Normalize input ranges", "Speed up processing", "Increase accuracy"] },
  //       { id: 9, text: "Which algorithm is used for recommendation systems?", options: ["Collaborative Filtering", "Bubble Sort", "Binary Search", "Quick Sort"] },
  //       { id: 10, text: "What is the purpose of backpropagation in neural networks?", options: ["Data cleaning", "Weight optimization", "Data storage", "Input validation"] }
  //     ]
  //   },
  //   coding: {
  //     title: "Coding Challenge",
  //     questions: [
  //       { id: 1, text: "Create a program to manage a library's book collection", options: ["number", "string", "undefined", "object"] },
  //       { id: 2, text: "Create a real-time chat application with the following features User Authentication, Real-Time Messaging, Private Messaging", options: ["pop()", "push()", "shift()", "unshift()"] }
  //     ]
  //   }
  // };
  // Fetch data from the backend

  const [isLoadingSections, setIsLoadingSections] = useState(true);

// Update your useEffect for fetching exam sections
useEffect(() => {
  const fetchExamSections = async () => {
    try {
      setIsLoadingSections(true); // Start loading
      const response = await fetch(
        "https://exam-portal-backend-334o.onrender.com/api/exam-sections"
      );
      if (!response.ok) throw new Error("Failed to fetch exam sections");
      const data = await response.json();
      
      if (Array.isArray(data) && data[0]) {
        const filteredSections = Object.entries(data[0])
          .filter(([key]) => key !== "_id" && key !== "__v")
          .reduce((acc, [key, value]) => {
            acc[key] = value as Section;
            return acc;
          }, {} as ExamSections);
        setExamSections(filteredSections);
      }
    } catch (error) {
      console.error("Error fetching exam sections:", error);
    } finally {
      setIsLoadingSections(false); // Stop loading regardless of success/error
    }
  };
  fetchExamSections();
}, []);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (examStarted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [examStarted, timeLeft]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleAutoSubmit = () => {
    console.log("Auto-submitting exam...", answers);
    console.log("Submitting exam sections...", examSectionsNew);
    // Stop camera recording
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      console.log("Recording stopped");
    }
    if (videoRef.current?.srcObject instanceof MediaStream) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
    }
    // Navigate to thank you page
    router.push("/thankyoupage");
  };

  const handleStartExam = () => {
    setExamStarted(true);
    setCurrentSection("mcqs");
    setCurrentQuestionIndex(0);

    const element = document.documentElement; // Get the root HTML element
    if (element.requestFullscreen) {
      element.requestFullscreen();
    }
  };

  useEffect(() => {
    if (!examStarted) return;
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        alert("Tab switching is not allowed during the exam. The exam will now be submitted.");
        handleAutoSubmit(); // Automatically submit the exam or take appropriate action
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [examStarted]);

  useEffect(() => {
    if (!examStarted) return;
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        alert(
          "Exiting full-screen mode is not allowed. The exam will now be submitted."
        );
        handleAutoSubmit();
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [examStarted]);

  const handleSectionChange = (section: string) => {
    const sectionIndex = SECTION_ORDER.indexOf(section);
    
    // Validate section order
    if (sectionIndex === -1) return;
    
    setCurrentSection(section);
    setCurrentQuestionIndex(0);
    
    // Handle coding section visibility
    if (section === "coding") {
      setIsContainerVisible(true);
      setIsSection4Visible(false);
    } else {
      setIsContainerVisible(false);
      setIsSection4Visible(true);
    }
  };

  const handleQuestionChange = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const handleNextQuestion = () => {
    const currentSectionIndex = SECTION_ORDER.indexOf(currentSection);
    const currentQuestions = examSectionsNew[currentSection]?.questions || [];
    
    // Check if there are more questions in current section
    if (currentQuestionIndex < currentQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Move to next section if available
      if (currentSectionIndex < SECTION_ORDER.length - 1) {
        const nextSection = SECTION_ORDER[currentSectionIndex + 1];
        setCurrentSection(nextSection);
        setCurrentQuestionIndex(0);
        
        // Update visibility states for coding section
        if (nextSection === "coding") {
          setIsContainerVisible(true);
          setIsSection4Visible(false);
        }
      }
    }
  };

  const handlePreviousQuestion = () => {
    const currentSectionIndex = SECTION_ORDER.indexOf(currentSection);
    // const currentQuestions = examSectionsNew[currentSection]?.questions || [];
    
    // Check if previous questions in current section
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    } else {
      // Move to previous section if available
      if (currentSectionIndex > 0) {
        const prevSection = SECTION_ORDER[currentSectionIndex - 1];
        setCurrentSection(prevSection);
        setCurrentQuestionIndex(examSectionsNew[prevSection].questions.length - 1);
        
        // Update visibility states when leaving coding section
        if (currentSection === "coding") {
          setIsContainerVisible(false);
          setIsSection4Visible(true);
        }
      }
    }
  };

  const handleAnswerSelect = (questionId: number, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [`${currentSection}-${questionId}`]: answer,
    }));
  };

  const isTimeWarning = timeLeft <= 300;

  // const renderQuestionContent = () => {
  //   if (!examStarted || currentSection === "home") return null;

  //   const currentQuestion = examSections[currentSection].questions[currentQuestionIndex];
  //   const questionKey = `${currentSection}-${currentQuestion.id}`;
  //   const selectedAnswer = answers[questionKey];

  //   return (
  //     <div className="space-y-6">
  //       <div className="bg-white p-6 rounded-lg shadow-sm">
  //         <h3 className="text-xl font-semibold mb-4">
  //           Question {currentQuestionIndex + 1}
  //         </h3>
  //         <p className="text-gray-700 text-lg mb-6">{currentQuestion.text}</p>

  //         <div className="space-y-3">
  //           {currentQuestion.options.map((option, idx) => (
  //             <button
  //               key={idx}
  //               onClick={() => handleAnswerSelect(currentQuestion.id, option)}
  //               className={`w-full text-left p-4 rounded-lg transition-all ${selectedAnswer === option
  //                 ? "bg-blue-100 border-blue-500 border-2"
  //                 : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
  //                 }`}
  //             >
  //               {option}
  //             </button>
  //           ))}
  //         </div>
  //       </div>

  //       <div className="flex justify-between items-center mt-6">
  //         <button
  //           onClick={handlePreviousQuestion}
  //           disabled={currentQuestionIndex === 0 && currentSection === "mcqs"}
  //           className="flex items-center space-x-2 px-6 py-3 bg-gray-100 rounded-lg hover:bg-gray-200
  //             disabled:opacity-50 disabled:cursor-not-allowed transition-all"
  //         >
  //           <ArrowLeft className="w-5 h-5" />
  //           <span>Previous</span>
  //         </button>

  //         <button
  //           onClick={handleNextQuestion}
  //           className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg
  //             hover:bg-blue-700 transition-all"
  //         >
  //           <span>Next</span>
  //           <ArrowRight className="w-5 h-5" />
  //         </button>
  //       </div>
  //     </div>
  //   );
  // };

  // const renderSectionContent = () => {
  //   if (currentSection === "home") {
  //     return (
  //       <div className="text-center py-12">
  //         <h1 className="text-4xl font-bold mb-4 text-blue-600">
  //           Welcome to the LNRS Assessment Portal
  //         </h1>
  //         {/* ... (rest of the home content remains the same) ... */}
  //         {!examStarted && (
  //           <button
  //             onClick={handleStartExam}
  //             className="bg-blue-600 text-white px-8 py-3 rounded-full hover:bg-blue-700
  //               transition-all hover:scale-105 active:scale-95 shadow-md text-lg"
  //           >
  //             Begin Assessment
  //           </button>
  //         )}
  //       </div>
  //     );
  //   }

  //   return renderQuestionContent();
  // };


  // Add mobile restriction
  
  return (
    <ProtectedRoute>
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <ToastContainer />
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-md backdrop-blur-sm bg-opacity-90 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">LT</span>
            </div>
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
              LNRS Technologies
            </div>
          </div>

          <div className="flex items-center space-x-6">
            {examStarted && (
              <div className="flex items-center space-x-4">
                {/* Camera Status */}
                <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-full">
                  {cameraEnabled ? (
                    <Camera className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <VideoOff className="w-5 h-5 text-red-600 dark:text-red-400" />
                  )}
                </div>

                {/* Recording Status */}
                {isRecording && (
                  <div className="flex items-center space-x-2 bg-red-50 dark:bg-red-900/30 px-3 py-2 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-red-600 dark:bg-red-400 animate-pulse" />
                    <span className="text-red-600 dark:text-red-400 text-sm font-medium">
                      REC
                    </span>
                  </div>
                )}
              </div>
            )}

            {examStarted ? (
              <div
                className={`flex items-center space-x-2 ${
                  isTimeWarning
                    ? "animate-pulse text-red-600 dark:text-red-400"
                    : "text-blue-600 dark:text-blue-400"
                } 
                font-mono text-lg px-4 py-2 rounded-full ${
                  isTimeWarning
                    ? "bg-red-50 dark:bg-red-900/30"
                    : "bg-blue-50 dark:bg-blue-900/30"
                }`}
              >
                <Timer className="w-5 h-5" />
                <span>{formatTime(timeLeft)}</span>
              </div>
            ) : (
              <div className="text-gray-600 dark:text-gray-300">
                Duration: 60 minutes
              </div>
            )}

            <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-700 px-4 py-2 rounded-full">
              <Mail className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              <span className="text-gray-600 dark:text-gray-300">
                {userEmail}
              </span>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Camera Error Alert */}
      {cameraError && <div className="mt-0"></div>}

      {/* Webcam Preview */}
      {examStarted && (
        <div className={`duration-500 z-50 fixed bottom-0 left-4`}>
          <Draggable>
            <div
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2"
              style={{ width: "150px" }}
            >
              <div className="flex justify-center items-center w-full h-full">
                <GripHorizontal className="text-gray-500" />
              </div>
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full rounded-lg"
                  style={{ height: "120px", objectFit: "cover" }}
                />
                {isRecording && (
                  <div className="absolute top-2 right-2 flex items-center space-x-1 bg-black bg-opacity-50 rounded-full px-2 py-1">
                    <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                    <span className="text-xs text-white">REC</span>
                  </div>
                )}
              </div>
              <div className="mt-1 flex items-center justify-between px-1">
                <div className="flex items-center space-x-1">
                  <Camera className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                  <span className="text-xs text-gray-600 dark:text-gray-300">
                    Camera Preview
                  </span>
                </div>
                <div className="flex items-center">
                  {cameraEnabled ? (
                    <div className="w-2 h-2 rounded-full bg-green-600 dark:bg-green-400" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-red-600 dark:bg-red-400" />
                  )}
                </div>
              </div>
            </div>
          </Draggable>
        </div>
      )}

      {/* Three-column Layout */}
      <div className="flex max-w-7xl mx-auto px-4 py-2 gap-4">
        {/* Column 1: Sections Menu */}
        <div className="w-[100px] flex-shrink-0 lg:w-[150px]">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg sticky top-24 p-4">
          <div className="flex flex-col space-y-1">
  <button
    onClick={() => handleSectionChange("home")}
    className={`flex items-center space-x-2 w-full p-2 rounded-lg transition-all
      ${currentSection === "home" ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : "hover:bg-gray-50 dark:hover:bg-gray-700"}`}
  >
    <Home className="w-5 h-5" />
    <span className="font-medium">Home</span>
  </button>

  {isLoadingSections ? (
    // Skeleton loading for sections
    Array.from({ length: 4 }).map((_, index) => (
      <div
        key={index}
        className="flex items-center space-x-2 w-full p-2 rounded-lg animate-pulse"
      >
        <div className="h-5 w-5 bg-gray-300 dark:bg-gray-600 rounded-full" />
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-16" />
      </div>
    ))
  ) : (
    // Actual section buttons
    Object.entries(examSectionsNew).map(([section], index) => (
      <button
        key={section}
        onClick={() => handleSectionChange(section)}
        disabled={!examStarted}
        className={`flex items-center space-x-2 w-full p-2 rounded-lg transition-all
          ${currentSection === section ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : "hover:bg-gray-50 dark:hover:bg-gray-700"}
          ${!examStarted ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {index === 0 && <BookOpen className="w-5 h-5" />}
        {index === 1 && <Brain className="w-5 h-5" />}
        {index === 2 && <RedoDot className="w-5 h-5" />}
        {index === 3 && <Code className="w-5 h-5" />}
        <span className="font-medium">Section {index + 1}</span>
      </button>
    ))
  )}

  {examStarted && (
    <button
      onClick={handleAutoSubmit}
      className="mt-1 w-full bg-blue-600 dark:bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-all hover:scale-105 active:scale-95 shadow-md"
    >
      Submit
    </button>
  )}
</div>
          </div>
        </div>

        {/* Column 2: Question Numbers */}
        {examStarted && currentSection !== "home" && (
          <div className="w-15 flex-shrink-0 hidden md:block">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg sticky top-24 p-2">
              <h3 className="font-small text-gray-600 dark:text-gray-300 mb-3 text-center">
                Q
              </h3>
              <div className="flex flex-col space-y-2">
                {examSectionsNew[currentSection].questions.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuestionChange(idx)}
                    className={`p-2 rounded-lg text-sm font-medium w-10 transition-all
                      ${
                        currentQuestionIndex === idx
                          ? "bg-blue-600 dark:bg-blue-500 text-white"
                          : answers[`${currentSection}-${idx + 1}`]
                          ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                          : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                  >
                    {/* Question*/} {idx + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Column 3: Main Content */}
        <div className="flex-1 ml-0 min-w-0">
          {isSection4Visible && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              {currentSection === "home" ? (
                <div className="text-center py-12">
                  <h1 className="text-4xl font-bold mb-4 text-blue-600 dark:text-blue-400">
                    Welcome to the LNRS Assessment Portal
                  </h1>

                  <div className="max-w-2xl mx-auto text-left mb-8 space-y-6">
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-6 rounded-xl">
                      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
                        Important Instructions
                      </h2>
                      <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                        <li className="flex items-start space-x-2">
                          <span className="text-blue-600 dark:text-blue-400 font-bold">
                            •
                          </span>
                          <span>
                            Duration: The exam is 60 minutes long. A timer will
                            be displayed at the top of the screen.
                          </span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="text-blue-600 dark:text-blue-400 font-bold">
                            •
                          </span>
                          <span>
                            Sections: The exam consists of 4 sections - MCQs,
                            Aptitude, AI, and Coding. Each section contains 10
                            questions.
                          </span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="text-blue-600 dark:text-blue-400 font-bold">
                            •
                          </span>
                          <span>
                            Navigation: You can move between questions using the
                            Previous/Next buttons or click question numbers
                            directly.
                          </span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="text-blue-600 dark:text-blue-400 font-bold">
                            •
                          </span>
                          <span>
                            Webcam: Your webcam must be enabled throughout the
                            exam for proctoring purposes.
                          </span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="text-blue-600 dark:text-blue-400 font-bold">
                            •
                          </span>
                          <span>
                            Browser: Do not close or refresh your browser during
                            the exam. This may result in loss of answers.
                          </span>
                        </li>
                      </ul>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/30 p-6 rounded-xl">
                      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
                        Before You Begin
                      </h2>
                      <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                        <li className="flex items-start space-x-2">
                          <span className="text-yellow-600 dark:text-yellow-400 font-bold">
                            •
                          </span>
                          <span>
                            Ensure you have a stable internet connection
                          </span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="text-yellow-600 dark:text-yellow-400 font-bold">
                            •
                          </span>
                          <span>
                            Check that your webcam is working properly
                          </span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="text-yellow-600 dark:text-yellow-400 font-bold">
                            •
                          </span>
                          <span>
                            Find a quiet, well-lit place to take the exam
                          </span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="text-yellow-600 dark:text-yellow-400 font-bold">
                            •
                          </span>
                          <span>Keep your ID proof ready for verification</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {!examStarted && (
                    <div className="space-y-4">
                      <p className="text-red-600 dark:text-red-400 font-medium">
                        By clicking &quot;Begin Assessment&quot;, you agree to
                        be monitored via webcam throughout the exam duration.
                      </p>
                      <button
                        onClick={handleStartExam}
                        className="bg-blue-600 dark:bg-blue-500 text-white px-8 py-3 rounded-full hover:bg-blue-700 dark:hover:bg-blue-600
                      transition-all hover:scale-105 active:scale-95 shadow-md text-lg"
                      >
                        Begin Assessment
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg">
                      <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
                        Question {currentQuestionIndex + 1}
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300 text-lg mb-6">
                        {
                          examSectionsNew[currentSection].questions[
                            currentQuestionIndex
                          ].text
                        }
                      </p>
                      <div className="space-y-3">
                        {examSectionsNew[currentSection].questions[
                          currentQuestionIndex
                        ].options.map((option, idx) => (
                          <button
                            key={idx}
                            onClick={() =>
                              handleAnswerSelect(
                                currentQuestionIndex + 1,
                                option
                              )
                            }
                            className={`w-full text-left p-4 rounded-xl transition-all ${
                              answers[
                                `${currentSection}-${currentQuestionIndex + 1}`
                              ] === option
                                ? "bg-blue-100 dark:bg-blue-900/50 border-blue-500 dark:border-blue-400 border-2"
                                : "bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-2 border-transparent"
                            }`}
                          >
                            <span className="flex items-center space-x-3">
                              <span className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium">
                                {String.fromCharCode(65 + idx)}
                              </span>
                              <span className="text-gray-800 dark:text-gray-200">
                                {option}
                              </span>
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-6">
                    <button
                      onClick={handlePreviousQuestion}
                      disabled={
                        currentQuestionIndex === 0 && currentSection === "mcqs"
                      }
                      className="flex items-center space-x-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg 
                      hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      <span className="text-gray-800 dark:text-gray-200">
                        Previous
                      </span>
                    </button>

                    <button
                      onClick={handleNextQuestion}
                      className="flex items-center space-x-2 px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg 
                      hover:bg-blue-700 dark:hover:bg-blue-600 transition-all"
                    >
                      <span>Next</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {isContainerVisible && (
            <div>
              <div className={`flex flex-col lg:flex-row xl:flex-row gap-4 bg-gray-800`}>
                <div className="w-full xl:w-1/2 bg-gray-800 shadow-lg rounded p-4 lg:p-6 overflow-auto">
                  <div className="flex">
                    <div className="bg-white dark:bg-gray-800 rounded-lg">
                      <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
                        Question {currentQuestionIndex + 1}
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300 text-lg mb-6">
                        {
                          examSectionsNew[currentSection].questions[
                            currentQuestionIndex
                          ].text
                        }
                      </p>
                      <div className="space-y-3">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={useCustomInput}
                            onChange={(e) => {
                              setUseCustomInput(e.target.checked);
                              if (!e.target.checked) {
                                setCustomInput("");
                              }
                            }}
                            className="form-checkbox h-4 w-4 text-blue-500"
                          />
                          <span className="text-white">Use Custom Input</span>
                        </label>
                        {useCustomInput ? (
                          <div className="mt-2">
                            <h3 className="text-lg font-semibold text-white mb-2">
                              Custom Input:
                            </h3>
                            <textarea
                              className="bg-gray-700 p-2 w-full rounded-md border border-gray-500 text-white"
                              value={customInput}
                              onChange={(e) => setCustomInput(e.target.value)}
                              placeholder="Enter custom input..."
                            />
                          </div>
                        ) : (
                          <div className="mt-4">
                            <h3 className="text-lg font-semibold text-white mb-2">
                              Sample Test Cases:
                            </h3>
                            <div className="bg-gray-700 p-3 rounded-md mb-4">
                              {examSectionsNew[currentSection].questions[
                                currentQuestionIndex
                              ].options
                                .filter((_, idx) => idx % 2 === 0)
                                .map((inputCase, idx) => (
                                  <div
                                    key={idx}
                                    className="text-gray-300 text-sm font-mono mb-2"
                                  >
                                    <div className="text-blue-300">
                                      Input {idx + 1}: {inputCase}
                                    </div>
                                    <div className="text-green-300 ml-4">
                                      Expected:{" "}
                                      {
                                        examSectionsNew[currentSection]
                                          .questions[currentQuestionIndex]
                                          .options[idx * 2 + 1]
                                      }
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}                        
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">
                          Test Inputs:
                        </h3>
                        <div className="bg-gray-700 p-3 rounded-md mb-4">
                          {inputValue.split("\n").map((tc, i) => (
                            <div
                              key={i}
                              className="text-gray-300 text-sm font-mono"
                            >
                              {tc.trim() || (
                                <span className="text-gray-500">
                                  (empty line)
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  className={`w-full xl:w-1/2 rounded-md overflow-hidden`}
                >
                  <div className="p-4 bg-gray-800 h-full">
                    <div className="mb-4 flex items-center space-x-4">
                      <select
                        value={language}
                        onChange={(e) =>
                          setLanguage(e.target.value as Language)
                        }
                        className="p-2 border border-gray-500 rounded-md bg-gray-700 text-white"
                      >
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                      </select>
                      <button
                        onClick={() => setCode("")}
                        className="p-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                      >
                        Reset
                      </button>

                      <button
                        onClick={handleRun}
                        className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                      >
                        Run
                      </button>
                    </div>
                    <div className="border-2 w-full border-gray-500 rounded-md shadow-sm bg-gray-900 text-white">
                      <CodeMirror
                        value={code}
                        height="300px"
                        extensions={[languageExtension, oneDark]}
                        onChange={(value) => handleChange(value)}
                        className="bg-gray-900 h-1/2"
                        placeholder={`Write your ${language} code here...`}
                        theme={oneDark}
                      />
                    </div>

                    <div className="mt-4">
                      {/* <div>
                        <h3 className="text-lg font-semibold text-white mb-2">
                          Test Inputs:
                        </h3>
                        <div className="bg-gray-700 p-3 rounded-md mb-4">
                          {inputValue.split("\n").map((tc, i) => (
                            <div
                              key={i}
                              className="text-gray-300 text-sm font-mono"
                            >
                              {tc.trim() || (
                                <span className="text-gray-500">
                                  (empty line)
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div> */}

                      <h3 className="text-lg font-semibold text-white mb-2">
                        Execution Results:
                      </h3>
                      <pre className="bg-gray-700 p-4 rounded-md border border-gray-500 text-white">
                        {output.split("\n").map((line, idx) => {
                          const isError =
                            line.includes("✗") || line.includes("Error");
                          return (
                            <div
                              key={idx}
                              className={
                                isError
                                  ? "text-red-400"
                                  : line.includes("✓")
                                  ? "text-green-400"
                                  : "text-white text-sm"
                              }
                            >
                              {line}
                            </div>
                          );
                        })}
                      </pre>
                      {/* <pre className="bg-gray-700 p-4 rounded-md border border-gray-500 text-white font-mono text-sm">
                        {output || "Click Run to see results..."}
                      </pre> */}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center mt-6">
                <button
                  onClick={handlePreviousQuestion}
                  disabled={
                    currentQuestionIndex === 0 && currentSection === "mcqs"
                  }
                  className="flex items-center space-x-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg 
                      hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="text-gray-800 dark:text-gray-200">
                    Previous
                  </span>
                </button>
                <button
                  onClick={handleNextQuestion}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg 
                      hover:bg-blue-700 dark:hover:bg-blue-600 transition-all"
                >
                  <span>Next</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </ProtectedRoute>
  );
};

export default ExamPortal;
