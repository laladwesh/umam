import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff } from "lucide-react";

const App = () => {
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [useCustomerBot, setUseCustomerBot] = useState(false);
  const recognition = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = true;
      recognition.current.interimResults = true;
      recognition.current.lang = "en-US";

      recognition.current.onresult = (event) => {
        if (event.results && event.results.length > 0) {
          const currentTranscript = Array.from(event.results)
            .map((result) => result[0])
            .map((result) => result.transcript)
            .join("");

          setTranscript(currentTranscript);

          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }

          timeoutRef.current = setTimeout(() => {
            if (currentTranscript.trim()) {
              sendMessage(currentTranscript);
              stopListening();
            }
          }, 2000);
        }
      };

      recognition.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        stopListening();
      };
    }

    return () => {
      if (recognition.current) {
        recognition.current.stop();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  const startListening = () => {
    try {
      if (recognition.current && !isLoading) {
        recognition.current.start();
        setIsListening(true);
        setTranscript("");
      }
    } catch (error) {
      console.error("Error starting speech recognition:", error);
    }
  };

  const stopListening = () => {
    try {
      if (recognition.current) {
        recognition.current.stop();
        setIsListening(false);
      }
    } catch (error) {
      console.error("Error stopping speech recognition:", error);
    }
  };

  const sendMessage = async (message) => {
    if (!message?.trim() || isLoading) return;
    setIsLoading(true);

    try {
      const response = await fetch("https://aliumam-bot.hf.space/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          type: useCustomerBot ? "customerbot" : "phonebot",
        }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();

      if (data && data.response) {
        const utterance = new SpeechSynthesisUtterance(data.response);
        utterance.onend = () => {
          setIsLoading(false);
          setTimeout(startListening, 800);
        };
        window.speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setIsLoading(false);
    }
  };

  const toggleBotType = () => {
    setUseCustomerBot((prevState) => !prevState);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white bg-opacity-95 rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Voice Assistant
          </h1>
          <p className="text-gray-600">
            {isListening
              ? "Listening..."
              : isLoading
              ? "Processing..."
              : "Click the mic to start"}
          </p>
        </div>

        {transcript && (
          <div className="mb-8 p-4 bg-blue-50 rounded-lg">
            <p className="text-gray-700">{transcript}</p>
          </div>
        )}

        <div className="flex justify-center items-center mb-4">
          <span className="mr-2 text-gray-700">PhoneBot</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only"
              checked={useCustomerBot}
              onChange={toggleBotType}
            />
            <div
              className={`w-11 h-6 ${
                useCustomerBot ? "bg-blue-600" : "bg-gray-200"
              } rounded-full transition-all`}
            ></div>
            <div
              className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow ${
                useCustomerBot ? "translate-x-5" : ""
              } transition-all`}
            ></div>
          </label>

          <span className="ml-2 text-gray-700">CustomerBot</span>
        </div>

        <div className="flex justify-center">
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={isLoading}
            className={`
              ${
                isListening
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-blue-500 hover:bg-blue-600"
              }
              ${isLoading ? "opacity-50 cursor-not-allowed" : "opacity-100"}
              rounded-full p-6 text-white transition-all duration-300 transform hover:scale-105
              shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-300
            `}
          >
            {isListening ? (
              <MicOff size={32} className="animate-pulse" />
            ) : (
              <Mic size={32} className={isLoading ? "opacity-50" : ""} />
            )}
          </button>
        </div>

        {isLoading && (
          <div className="mt-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
