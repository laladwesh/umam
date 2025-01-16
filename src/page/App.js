import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff } from "lucide-react";

const AppPage = () => {
    const [isListening, setIsListening] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [sessionId, setSessionId] = useState(null);
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

    const generateSessionId = () => {
        return Math.floor(Math.random() * 1000000000);
    };

    const startListening = () => {
        try {
            if (recognition.current && !isLoading) {
                // Generate new session ID when starting to listen
                const newSessionId = generateSessionId();
                setSessionId(newSessionId);
                console.log("New phone session started with ID:", newSessionId);
                
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
                // Clear session ID when stopping
                setSessionId(null);
            }
        } catch (error) {
            console.error("Error stopping speech recognition:", error);
        }
    };

    const sendMessage = async (message) => {
        if (!message?.trim() || isLoading) return;
        setIsLoading(true);

        try {
            console.log("Sending message with phone session ID:", sessionId);
            const response = await fetch("https://aliumam-bot.hf.space/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message,
                    type: "phonebot",
                }),
            });

            if (!response.ok) {
                throw new Error("Network response was not ok");
            }

            const data = await response.json();

            if (data) {
                const utterance = new SpeechSynthesisUtterance(data);
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
                    {/* {sessionId && (
                        <p className="text-sm text-gray-500 mt-2">
                            Session ID: {sessionId}
                        </p>
                    )} */}
                </div>

                {transcript && (
                    <div className="mb-8 p-4 bg-blue-50 rounded-lg">
                        <p className="text-gray-700">{transcript}</p>
                    </div>
                )}

                <div className="flex justify-center items-center mb-4">
                    <span className="mr-2 text-gray-700">PhoneBot</span>
                </div>

                <div className="flex justify-center">
                    <button
                        onClick={isListening ? stopListening : startListening}
                        disabled={isLoading}
                        className={`
                            ${isListening
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
                <a href="/cust" className="block text-center mt-4 text-blue-500 hover:text-blue-600">
                    Customer Bot
                </a>
            </div>
        </div>
    );
};

export default AppPage;